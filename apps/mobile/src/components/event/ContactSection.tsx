import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ContactInfo } from '@monorepo-vtex/shared/types/event-settings';

interface ContactSectionProps {
  contact: ContactInfo;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ contact }) => {
  const handleEmailPress = () => {
    const emailUrl = `mailto:${encodeURIComponent(contact.email)}`;
    Linking.openURL(emailUrl).catch((err) => {
      console.error('Error opening email:', err);
    });
  };

  const handlePhonePress = () => {
    const phoneUrl = `tel:${contact.phone}`;
    Linking.openURL(phoneUrl).catch((err) => {
      console.error('Error opening phone:', err);
    });
  };

  const handleWhatsAppPress = () => {
    if (!contact.whatsapp) return;

    // Remove all non-numeric characters from phone number
    const cleanNumber = contact.whatsapp.replace(/\D/g, '');
    const whatsappUrl = `whatsapp://send?phone=${cleanNumber}`;

    Linking.openURL(whatsappUrl).catch((err) => {
      console.error('Error opening WhatsApp:', err);
      // Fallback to web version
      const webUrl = `https://wa.me/${cleanNumber}`;
      Linking.openURL(webUrl).catch((webErr) => {
        console.error('Error opening WhatsApp web:', webErr);
      });
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>📞</Text>
        <Text style={styles.title}>Contato</Text>
      </View>
      <View style={styles.content}>
        {/* Email */}
        <TouchableOpacity
          style={styles.contactItem}
          onPress={handleEmailPress}
          accessibilityRole="button"
          accessibilityLabel="Enviar email para contato"
          accessibilityHint="Abre o aplicativo de email"
        >
          <Text style={styles.contactIcon}>📧</Text>
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{contact.email}</Text>
          </View>
        </TouchableOpacity>

        {/* Phone */}
        <TouchableOpacity
          style={styles.contactItem}
          onPress={handlePhonePress}
          accessibilityRole="button"
          accessibilityLabel="Ligar para o telefone de contato"
          accessibilityHint="Abre o aplicativo de telefone"
        >
          <Text style={styles.contactIcon}>📱</Text>
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactLabel}>Telefone</Text>
            <Text style={styles.contactValue}>{contact.phone}</Text>
          </View>
        </TouchableOpacity>

        {/* WhatsApp (optional) */}
        {contact.whatsapp && (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={handleWhatsAppPress}
            accessibilityRole="button"
            accessibilityLabel="Abrir WhatsApp para contato"
            accessibilityHint="Abre o aplicativo WhatsApp"
          >
            <Text style={styles.contactIcon}>💬</Text>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={styles.contactValue}>{contact.whatsapp}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    paddingLeft: 32,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#0F47AF',
    fontWeight: '500',
  },
});