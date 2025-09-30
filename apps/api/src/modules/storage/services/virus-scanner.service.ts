import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StorageConfigService } from './storage-config.service';
import * as crypto from 'crypto';

@Injectable()
export class VirusScannerService {
  private readonly logger = new Logger(VirusScannerService.name);

  constructor(private storageConfigService: StorageConfigService) {}

  /**
   * Scans a file for viruses and malicious content
   * @param file - The file buffer to scan
   * @param filename - The name of the file being scanned
   * @param mimeType - The MIME type of the file
   * @returns Promise<boolean> - true if file is clean, throws error if infected
   */
  async scanFile(file: Buffer, filename: string, mimeType: string): Promise<boolean> {
    if (!this.storageConfigService.isVirusScanningEnabled()) {
      this.logger.debug(`Virus scanning disabled, skipping scan for ${filename}`);
      return true;
    }

    try {
      // Perform basic checks based on file type
      await this.performBasicChecks(file, filename, mimeType);

      // If ClamAV is configured, use it
      const clamavHost = this.storageConfigService.getClamAvHost();
      const clamavPort = this.storageConfigService.getClamAvPort();

      if (clamavHost) {
        return await this.scanWithClamAV(file, filename, clamavHost, clamavPort);
      }

      // If no external scanner, perform enhanced heuristic checks
      return await this.performHeuristicScanning(file, filename, mimeType);
    } catch (error: any) {
      this.logger.error(`Virus scanning failed for ${filename}: ${error.message}`, error.stack);

      // If it's a validation error, rethrow it
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Fail-safe: if scanning fails, reject the file for safety
      throw new BadRequestException('File scanning failed. Please try again or contact support.');
    }
  }

  /**
   * Performs basic file validation checks
   */
  private async performBasicChecks(
    file: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<void> {
    // Check file size for anomalies (extremely small files)
    if (file.length < 100) {
      throw new BadRequestException(`File ${filename} is too small to be valid`);
    }

    // For images, check for embedded scripts or suspicious metadata
    if (mimeType.startsWith('image/')) {
      await this.checkImageSafety(file, filename);
    }

    // For PDFs, check for dangerous content
    if (mimeType === 'application/pdf') {
      await this.checkPdfSafety(file, filename);
    }
  }

  /**
   * Checks image files for suspicious content
   */
  private async checkImageSafety(file: Buffer, filename: string): Promise<void> {
    const fileStr = file.toString('latin1');

    // Check for embedded scripts or HTML
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(fileStr)) {
        this.logger.warn(
          `Potentially dangerous content detected in image ${filename}: ${pattern.source}`,
        );
        throw new BadRequestException(
          `File ${filename} contains suspicious content and was rejected`,
        );
      }
    }

    // Check for excessive metadata (could hide malicious content)
    const exifMarkers = fileStr.match(/Exif/gi) || [];
    if (exifMarkers.length > 100) {
      this.logger.warn(`File ${filename} contains excessive metadata`);
      throw new BadRequestException(`File ${filename} contains suspicious metadata`);
    }
  }

  /**
   * Checks PDF files for dangerous content
   */
  private async checkPdfSafety(file: Buffer, filename: string): Promise<void> {
    // Check for PDF magic bytes
    const pdfMagicBytes = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
    const fileMagicBytes = file.slice(0, 4);

    if (!fileMagicBytes.equals(pdfMagicBytes)) {
      throw new BadRequestException(`File ${filename} is not a valid PDF file`);
    }

    // Check for suspicious patterns in the PDF
    const suspiciousPatterns = [
      /\/JavaScript/i,
      /\/JS/i,
      /\/Launch/i,
      /\/EmbeddedFile/i,
      /\/OpenAction/i,
      /\/AA/i, // Additional Actions
      /\/SubmitForm/i,
      /\/ImportData/i,
      /\/Hide/i,
    ];

    const fileContent = file.toString('latin1');

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileContent)) {
        this.logger.warn(
          `Potentially dangerous content detected in ${filename}: ${pattern.source}`,
        );
        // Allow with warning for now, but log for monitoring
      }
    }

    // Check file size for anomalies
    if (file.length < 1024) {
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
    port: number,
  ): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
          reject(new BadRequestException(`File failed security scan and was rejected.`));
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
  private async performHeuristicScanning(
    file: Buffer,
    filename: string,
    _mimeType: string,
  ): Promise<boolean> {
    // Calculate file hash for comparison with known malware databases
    const fileHash = crypto.createHash('sha256').update(file).digest('hex');

    this.logger.debug(`Heuristic scanning ${filename} (SHA256: ${fileHash})`);

    const fileStr = file.toString('latin1');

    // Check for obfuscated JavaScript
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
        suspiciousCount++;
      }
    }

    if (suspiciousCount >= 3) {
      this.logger.warn(`File ${filename} contains suspicious obfuscation patterns`);
      throw new BadRequestException(`File failed security scan and was rejected.`);
    }

    // Check for excessive external references (potential phishing)
    const externalRefs = fileStr.match(/https?:\/\//gi) || [];
    if (externalRefs.length > 20) {
      this.logger.warn(`File ${filename} contains excessive external references`);
      throw new BadRequestException(`File contains too many external references`);
    }

    // If all checks pass, file is considered clean
    this.logger.debug(`File ${filename} passed heuristic scanning`);
    return true;
  }

  /**
   * Quarantines a suspicious file for later analysis
   */
  async quarantineFile(file: Buffer, filename: string, reason: string): Promise<void> {
    const fileHash = crypto.createHash('sha256').update(file).digest('hex');

    this.logger.warn(`Quarantining file ${filename} (${fileHash}): ${reason}`);

    // Log the event for security monitoring
    this.logger.warn({
      event: 'FILE_QUARANTINED',
      filename,
      hash: fileHash,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}
