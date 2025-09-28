/**
 * Formats Brazilian CEP (postal code) with proper masking
 * @param value - The raw CEP string
 * @returns Formatted CEP string (XXXXX-XXX)
 */
export function formatBrazilianCEP(value: string): string {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');

  // Limit to 8 digits (Brazilian CEP format)
  const limited = cleaned.substring(0, 8);

  // Apply formatting based on length
  if (limited.length === 0) return '';
  if (limited.length <= 5) return limited;

  // CEP format: 12345-678
  return `${limited.slice(0, 5)}-${limited.slice(5)}`;
}

/**
 * Validates Brazilian CEP format
 * @param cep - The CEP to validate
 * @returns True if valid, false otherwise
 */
export function validateBrazilianCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '');

  // Check if it has exactly 8 digits
  if (cleaned.length !== 8) {
    return false;
  }

  // Check if it's not all zeros or all the same digit
  if (/^0+$/.test(cleaned) || /^(\d)\1+$/.test(cleaned)) {
    return false;
  }

  return true;
}

/**
 * Fetches address data from CEP using ViaCEP API
 * @param cep - The CEP to lookup
 * @returns Address data or null if not found
 */
export async function fetchAddressByCEP(cep: string): Promise<{
  street: string;
  neighborhood: string;
  city: string;
  state: string;
} | null> {
  const cleaned = cep.replace(/\D/g, '');

  if (!validateBrazilianCEP(cleaned)) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    const data = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch {
    return null;
  }
}