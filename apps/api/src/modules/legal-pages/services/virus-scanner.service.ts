import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class VirusScannerService {
  private readonly logger = new Logger(VirusScannerService.name);
  private readonly scanningEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.scanningEnabled = this.configService.get<boolean>('VIRUS_SCANNING_ENABLED', false);
  }

  /**
   * Scans a file for viruses
   * @param file - The file buffer to scan
   * @param filename - The name of the file being scanned
   * @returns Promise<boolean> - true if file is clean, throws error if infected
   */
  async scanFile(file: Buffer, filename: string): Promise<boolean> {
    if (!this.scanningEnabled) {
      this.logger.debug(`Virus scanning disabled, skipping scan for ${filename}`);
      return true;
    }

    try {
      // Perform basic checks
      await this.performBasicChecks(file, filename);

      // If ClamAV is configured, use it
      const clamavHost = this.configService.get<string>('CLAMAV_HOST');
      const clamavPort = this.configService.get<number>('CLAMAV_PORT', 3310);

      if (clamavHost) {
        return await this.scanWithClamAV(file, filename, clamavHost, clamavPort);
      }

      // If no external scanner, perform enhanced heuristic checks
      return await this.performHeuristicScanning(file, filename);
    } catch (error: any) {
      this.logger.error(`Virus scanning failed for ${filename}: ${error.message}`, error.stack);

      // Fail-safe: if scanning fails, reject the file for safety
      throw new BadRequestException('File scanning failed. Please try again or contact support.');
    }
  }

  /**
   * Performs basic file validation checks
   */
  private async performBasicChecks(file: Buffer, filename: string): Promise<void> {
    // Check for PDF magic bytes
    const pdfMagicBytes = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
    const fileMagicBytes = file.slice(0, 4);

    if (!fileMagicBytes.equals(pdfMagicBytes)) {
      throw new BadRequestException(`File ${filename} is not a valid PDF file`);
    }

    // Check for suspicious patterns in the file
    const suspiciousPatterns = [
      /\/JavaScript/i,
      /\/JS/i,
      /\/Launch/i,
      /\/EmbeddedFile/i,
      /\/OpenAction/i,
      /\/AA/i, // Additional Actions
      /\/URI/i, // External URLs
      /\/SubmitForm/i,
      /\/ImportData/i,
      /\/Hide/i,
    ];

    const fileContent = file.toString('latin1');

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileContent)) {
        this.logger.warn(
          `Potentially dangerous content detected in ${filename}: ${pattern.source}`
        );

        // Allow with warning for now, but log for monitoring
        // In production, you might want to reject these files
        // throw new BadRequestException(
        //   `File ${filename} contains potentially dangerous content and was rejected`
        // );
      }
    }

    // Check file size for anomalies (e.g., extremely small PDF)
    if (file.length < 1024) {
      // Less than 1KB is suspicious for a PDF
      throw new BadRequestException(`File ${filename} is too small to be a valid PDF`);
    }
  }

  /**
   * Scans file using ClamAV antivirus
   */
  private async scanWithClamAV(
    file: Buffer,
    filename: string,
    host: string,
    port: number
  ): Promise<boolean> {
    const net = require('net');

    return new Promise((resolve, reject) => {
      const client = new net.Socket();

      client.setTimeout(30000); // 30 second timeout

      client.connect(port, host, () => {
        this.logger.debug(`Connected to ClamAV at ${host}:${port}`);

        // Send INSTREAM command
        client.write('zINSTREAM\0');

        // Send file size and content in chunks
        const chunkSize = 65536; // 64KB chunks
        let offset = 0;

        while (offset < file.length) {
          const chunk = file.slice(offset, Math.min(offset + chunkSize, file.length));
          const sizeBuffer = Buffer.allocUnsafe(4);
          sizeBuffer.writeUInt32BE(chunk.length, 0);
          client.write(sizeBuffer);
          client.write(chunk);
          offset += chunkSize;
        }

        // Send zero-length chunk to indicate end
        const endBuffer = Buffer.allocUnsafe(4);
        endBuffer.writeUInt32BE(0, 0);
        client.write(endBuffer);
      });

      client.on('data', (data: Buffer) => {
        const response = data.toString().trim();
        client.destroy();

        if (response === 'stream: OK') {
          this.logger.debug(`File ${filename} is clean`);
          resolve(true);
        } else if (response.includes('FOUND')) {
          const virus = response.match(/stream: (.+) FOUND/)?.[1] || 'Unknown';
          this.logger.warn(`Virus detected in ${filename}: ${virus}`);
          reject(new BadRequestException(`File ${filename} is infected with ${virus}`));
        } else {
          this.logger.error(`Unknown ClamAV response: ${response}`);
          reject(new Error('Unknown virus scan response'));
        }
      });

      client.on('error', (error: Error) => {
        this.logger.error(`ClamAV connection error: ${error.message}`);
        client.destroy();
        reject(error);
      });

      client.on('timeout', () => {
        this.logger.error('ClamAV scan timeout');
        client.destroy();
        reject(new Error('Virus scan timeout'));
      });
    });
  }

  /**
   * Performs heuristic virus scanning without external service
   */
  private async performHeuristicScanning(file: Buffer, filename: string): Promise<boolean> {
    // Calculate file hash for comparison with known malware databases
    const fileHash = crypto.createHash('sha256').update(file).digest('hex');

    this.logger.debug(`Heuristic scanning ${filename} (SHA256: ${fileHash})`);

    // Check for obfuscated JavaScript
    const fileStr = file.toString('latin1');
    const obfuscationPatterns = [
      /eval\s*\(/i,
      /unescape\s*\(/i,
      /String\.fromCharCode/i,
      /\\x[0-9a-f]{2}/gi,
      /\\u[0-9a-f]{4}/gi,
    ];

    let suspiciousCount = 0;
    for (const pattern of obfuscationPatterns) {
      const matches = fileStr.match(pattern);
      if (matches && matches.length > 5) {
        // More than 5 occurrences is suspicious
        suspiciousCount++;
      }
    }

    if (suspiciousCount >= 3) {
      this.logger.warn(`File ${filename} contains suspicious obfuscation patterns`);
      throw new BadRequestException(
        `File ${filename} contains suspicious content and was rejected`
      );
    }

    // Check for excessive external references
    const externalRefs = fileStr.match(/\/URI\s*\(/gi) || [];
    if (externalRefs.length > 10) {
      this.logger.warn(`File ${filename} contains excessive external references`);
      throw new BadRequestException(
        `File ${filename} contains too many external references`
      );
    }

    // If all checks pass, file is considered clean
    this.logger.debug(`File ${filename} passed heuristic scanning`);
    return true;
  }

  /**
   * Quarantines a suspicious file for later analysis
   */
  async quarantineFile(
    file: Buffer,
    filename: string,
    reason: string
  ): Promise<void> {
    const fileHash = crypto.createHash('sha256').update(file).digest('hex');

    this.logger.warn(`Quarantining file ${filename} (${fileHash}): ${reason}`);

    // In production, you would:
    // 1. Move file to quarantine storage
    // 2. Log details to security monitoring system
    // 3. Alert security team
    // 4. Store metadata for analysis

    // For now, just log the event
    this.logger.warn({
      event: 'FILE_QUARANTINED',
      filename,
      hash: fileHash,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}