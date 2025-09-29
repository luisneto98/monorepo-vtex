import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import SocialLinksBar from '../../../src/components/social/SocialLinksBar';

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

describe('SocialLinksBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSpeakerName = 'John Doe';

  const mockSocialLinks = {
    linkedin: 'https://linkedin.com/in/johndoe',
    twitter: 'https://twitter.com/johndoe',
    github: 'https://github.com/johndoe',
    website: 'https://johndoe.com',
  };

  describe('Rendering', () => {
    it('should render all available social links', () => {
      const { getByText } = render(
        <SocialLinksBar socialLinks={mockSocialLinks} speakerName={mockSpeakerName} />
      );

      expect(getByText('LinkedIn')).toBeTruthy();
      expect(getByText('Twitter')).toBeTruthy();
      expect(getByText('GitHub')).toBeTruthy();
      expect(getByText('Website')).toBeTruthy();
    });

    it('should only render links that are provided', () => {
      const partialLinks = {
        linkedin: 'https://linkedin.com/in/johndoe',
      };

      const { getByText, queryByText } = render(
        <SocialLinksBar socialLinks={partialLinks} speakerName={mockSpeakerName} />
      );

      expect(getByText('LinkedIn')).toBeTruthy();
      expect(queryByText('Twitter')).toBeNull();
      expect(queryByText('GitHub')).toBeNull();
      expect(queryByText('Website')).toBeNull();
    });

    it('should return null when no social links are provided', () => {
      const { container } = render(
        <SocialLinksBar socialLinks={{}} speakerName={mockSpeakerName} />
      );

      expect(container.children.length).toBe(0);
    });
  });

  describe('URL Validation', () => {
    it('should reject non-https URLs for social platforms', async () => {
      const invalidLinks = {
        linkedin: 'http://linkedin.com/in/johndoe',
      };

      const { getByText } = render(
        <SocialLinksBar socialLinks={invalidLinks} speakerName={mockSpeakerName} />
      );

      fireEvent.press(getByText('LinkedIn'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Link inválido',
          expect.stringContaining('não é válido ou não é seguro')
        );
      });

      expect(Linking.canOpenURL).not.toHaveBeenCalled();
    });

    it('should reject URLs from non-allowlisted domains', async () => {
      const maliciousLinks = {
        linkedin: 'https://evil.com/phishing',
      };

      const { getByText } = render(
        <SocialLinksBar socialLinks={maliciousLinks} speakerName={mockSpeakerName} />
      );

      fireEvent.press(getByText('LinkedIn'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Link inválido',
          expect.stringContaining('não é válido ou não é seguro')
        );
      });

      expect(Linking.canOpenURL).not.toHaveBeenCalled();
    });

    it('should accept valid social media URLs', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const { getByText } = render(
        <SocialLinksBar socialLinks={mockSocialLinks} speakerName={mockSpeakerName} />
      );

      fireEvent.press(getByText('LinkedIn'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Abrir link externo',
          expect.stringContaining('LinkedIn'),
          expect.any(Array)
        );
      });
    });

    it('should allow any https URL for website platform', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const customWebsite = {
        website: 'https://mycustomdomain.xyz',
      };

      const { getByText } = render(
        <SocialLinksBar socialLinks={customWebsite} speakerName={mockSpeakerName} />
      );

      fireEvent.press(getByText('Website'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Abrir link externo',
          expect.any(String),
          expect.any(Array)
        );
      });
    });
  });

  describe('Link Opening Flow', () => {
    it('should show confirmation dialog before opening link', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);

      const { getByText } = render(
        <SocialLinksBar socialLinks={mockSocialLinks} speakerName={mockSpeakerName} />
      );

      fireEvent.press(getByText('LinkedIn'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Abrir link externo',
          expect.stringContaining('LinkedIn'),
          expect.arrayContaining([
            expect.objectContaining({ text: 'Cancelar' }),
            expect.objectContaining({ text: 'Abrir' }),
          ])
        );
      });
    });

    it('should open URL when user confirms', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      // Mock Alert.alert to automatically call the "Abrir" button callback
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const openButton = buttons?.find((b: { text: string; onPress?: () => void }) => b.text === 'Abrir');
        if (openButton?.onPress) {
          openButton.onPress();
        }
      });

      const { getByText } = render(
        <SocialLinksBar socialLinks={mockSocialLinks} speakerName={mockSpeakerName} />
      );

      fireEvent.press(getByText('LinkedIn'));

      await waitFor(() => {
        expect(Linking.openURL).toHaveBeenCalledWith('https://linkedin.com/in/johndoe');
      });
    });

    it('should handle unsupported URLs', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const { getByText } = render(
        <SocialLinksBar socialLinks={mockSocialLinks} speakerName={mockSpeakerName} />
      );

      fireEvent.press(getByText('LinkedIn'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Link inválido',
          expect.stringContaining('Não foi possível abrir o link')
        );
      });
    });

    it('should handle errors when opening URLs', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockRejectedValue(new Error('Failed to open URL'));

      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const openButton = buttons?.find((b: { text: string; onPress?: () => void }) => b.text === 'Abrir');
        if (openButton?.onPress) {
          openButton.onPress();
        }
      });

      const { getByText } = render(
        <SocialLinksBar socialLinks={mockSocialLinks} speakerName={mockSpeakerName} />
      );

      fireEvent.press(getByText('LinkedIn'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erro',
          expect.stringContaining('Não foi possível abrir o link')
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(
        <SocialLinksBar socialLinks={mockSocialLinks} speakerName={mockSpeakerName} />
      );

      expect(getByLabelText(`Abrir LinkedIn de ${mockSpeakerName}`)).toBeTruthy();
      expect(getByLabelText(`Abrir Twitter de ${mockSpeakerName}`)).toBeTruthy();
    });
  });
});