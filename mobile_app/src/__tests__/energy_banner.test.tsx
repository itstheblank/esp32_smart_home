import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../context/I18nContext';
import { MqttProvider } from '../context/MqttContext';
import { DeviceProvider } from '../context/DeviceContext';
import { LogProvider } from '../context/LogContext';
import { EnergyBanner } from '../components/cards/EnergyBanner';

function TestWrapper({
  children,
  initialLang = 'vi',
  initialDark = false,
}: {
  children: React.ReactNode;
  initialLang?: 'vi' | 'en';
  initialDark?: boolean;
}) {
  return (
    <ThemeProvider initialDark={initialDark}>
      <I18nProvider initialLang={initialLang}>
        <MqttProvider>
          <DeviceProvider>
            <LogProvider>{children}</LogProvider>
          </DeviceProvider>
        </MqttProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

describe('EnergyBanner Prototype-Aligned Component Tests', () => {
  it('renders energy card title, percentage, and default status correctly in Vietnamese', () => {
    const html = renderToStaticMarkup(
      <TestWrapper initialLang="vi">
        <EnergyBanner />
      </TestWrapper>
    );

    // Tiết Kiệm Năng Lượng
    expect(html).toContain('Tiết Kiệm Năng Lượng');
    // Percentage
    expect(html).toContain('+35%');
    // ESP32 Status
    expect(html).toContain('ESP32:');
  });

  it('renders energy card in English correctly', () => {
    const html = renderToStaticMarkup(
      <TestWrapper initialLang="en">
        <EnergyBanner percent="+42%" />
      </TestWrapper>
    );

    expect(html).toContain('Energy Saving');
    expect(html).toContain('+42%');
    expect(html).toContain('ESP32:');
  });

  it('renders correctly in dark mode', () => {
    const html = renderToStaticMarkup(
      <TestWrapper initialDark={true}>
        <EnergyBanner />
      </TestWrapper>
    );

    expect(html).toBeDefined();
    expect(html).toContain('ESP32:');
  });
});
