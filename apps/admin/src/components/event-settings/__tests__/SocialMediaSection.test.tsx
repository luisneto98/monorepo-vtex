import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SocialMediaSection } from '../SocialMediaSection';
import { FormProvider, useForm } from 'react-hook-form';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Facebook: ({ className }: { className?: string }) => <div data-testid="facebook-icon" className={className} />,
  Twitter: ({ className }: { className?: string }) => <div data-testid="twitter-icon" className={className} />,
  Instagram: ({ className }: { className?: string }) => <div data-testid="instagram-icon" className={className} />,
  Linkedin: ({ className }: { className?: string }) => <div data-testid="linkedin-icon" className={className} />,
  Youtube: ({ className }: { className?: string }) => <div data-testid="youtube-icon" className={className} />,
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      socialMedia: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: ''
      }
    }
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('SocialMediaSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all social media input fields', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    expect(screen.getByText(/Facebook/i)).toBeInTheDocument();
    expect(screen.getByText(/Twitter\/X/i)).toBeInTheDocument();
    expect(screen.getByText(/Instagram/i)).toBeInTheDocument();
    expect(screen.getByText(/LinkedIn/i)).toBeInTheDocument();
    expect(screen.getByText(/YouTube/i)).toBeInTheDocument();
  });

  it('displays social media icons', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    expect(screen.getByTestId('facebook-icon')).toBeInTheDocument();
    expect(screen.getByTestId('twitter-icon')).toBeInTheDocument();
    expect(screen.getByTestId('instagram-icon')).toBeInTheDocument();
    expect(screen.getByTestId('linkedin-icon')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-icon')).toBeInTheDocument();
  });

  it('accepts various URL formats for social media links', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    const facebookInput = screen.getByPlaceholderText(/facebook.com\/vtexday/i);

    fireEvent.change(facebookInput, { target: { value: 'https://facebook.com/vtexday' } });
    expect(facebookInput).toHaveValue('https://facebook.com/vtexday');

    fireEvent.change(facebookInput, { target: { value: 'http://facebook.com/vtexday' } });
    expect(facebookInput).toHaveValue('http://facebook.com/vtexday');
  });

  it('accepts URLs with various protocols', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    const twitterInput = screen.getByPlaceholderText(/twitter.com\/vtexday/i);
    const instagramInput = screen.getByPlaceholderText(/instagram.com\/vtexday/i);

    fireEvent.change(twitterInput, { target: { value: 'https://twitter.com/vtexday' } });
    fireEvent.change(instagramInput, { target: { value: 'https://instagram.com/vtexday' } });

    expect(twitterInput).toHaveValue('https://twitter.com/vtexday');
    expect(instagramInput).toHaveValue('https://instagram.com/vtexday');
  });

  it('shows placeholder text for each field', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    expect(screen.getByPlaceholderText(/facebook\.com\/vtexday/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/twitter\.com\/vtexday/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/instagram\.com\/vtexday/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/linkedin\.com\/company\/vtex/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/youtube\.com\/@vtexday/i)).toBeInTheDocument();
  });

  it('allows clearing social media fields', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    const facebookInput = screen.getByPlaceholderText(/facebook.com\/vtexday/i);

    fireEvent.change(facebookInput, { target: { value: 'https://facebook.com/vtexday' } });
    expect(facebookInput).toHaveValue('https://facebook.com/vtexday');

    fireEvent.change(facebookInput, { target: { value: '' } });
    expect(facebookInput).toHaveValue('');
  });

  it('handles URL input with whitespace', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    const linkedinInput = screen.getByPlaceholderText(/linkedin.com\/company\/vtex/i);

    fireEvent.change(linkedinInput, { target: { value: '  https://linkedin.com/company/vtex  ' } });

    expect(linkedinInput).toHaveValue('  https://linkedin.com/company/vtex  ');
  });

  it('displays helper text for social media links', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    expect(screen.getByText(/Adicione links para as redes sociais do evento \(opcional\)/i)).toBeInTheDocument();
  });

  it('handles special characters in URLs', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    const youtubeInput = screen.getByPlaceholderText(/youtube.com\/@vtexday/i);

    fireEvent.change(youtubeInput, { target: { value: 'https://youtube.com/@vtex-day-2026' } });

    expect(youtubeInput).toHaveValue('https://youtube.com/@vtex-day-2026');
  });

  it('accepts various Instagram URL formats', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    const instagramInput = screen.getByPlaceholderText(/instagram.com\/vtexday/i);

    fireEvent.change(instagramInput, { target: { value: 'https://instagram.com/vtexday' } });
    expect(instagramInput).toHaveValue('https://instagram.com/vtexday');

    fireEvent.change(instagramInput, { target: { value: 'http://instagram.com/vtexday' } });
    expect(instagramInput).toHaveValue('http://instagram.com/vtexday');
  });

  it('allows empty fields (social media links are optional)', () => {
    const TestForm = () => {
      const methods = useForm({
        defaultValues: {
          socialMedia: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: '',
            youtube: ''
          }
        }
      });

      const onSubmit = vi.fn();

      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <SocialMediaSection />
            <button type="submit">Submit</button>
          </form>
        </FormProvider>
      );
    };

    render(<TestForm />);

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    expect(screen.queryByText(/campo obrigatório/i)).not.toBeInTheDocument();
  });

  it('preserves social media data on re-render', () => {
    const { rerender } = render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    const facebookInput = screen.getByPlaceholderText(/facebook.com\/vtexday/i);
    fireEvent.change(facebookInput, { target: { value: 'https://facebook.com/vtexday' } });

    rerender(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    expect(screen.getByPlaceholderText(/facebook.com\/vtexday/i)).toHaveValue('https://facebook.com/vtexday');
  });

  it('handles paste events for URLs', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    const twitterInput = screen.getByPlaceholderText(/twitter.com\/vtexday/i);

    // Simulate paste by changing value
    fireEvent.change(twitterInput, { target: { value: 'https://twitter.com/vtexday' } });

    expect(twitterInput).toHaveValue('https://twitter.com/vtexday');
  });

  it('has correct input type for URL fields', () => {
    render(
      <Wrapper>
        <SocialMediaSection />
      </Wrapper>
    );

    const facebookInput = screen.getByPlaceholderText(/facebook.com\/vtexday/i);
    const instagramInput = screen.getByPlaceholderText(/instagram.com\/vtexday/i);

    expect(facebookInput).toHaveAttribute('type', 'url');
    expect(instagramInput).toHaveAttribute('type', 'url');
  });
});