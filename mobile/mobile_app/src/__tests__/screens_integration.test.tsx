import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../../App';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../context/I18nContext';
import { MqttProvider } from '../context/MqttContext';
import { DeviceProvider } from '../context/DeviceContext';
import { LogProvider } from '../context/LogContext';
import { SplashScreen } from '../screens/SplashScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ActivityLogScreen } from '../screens/ActivityLogScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FloatingDockBar } from '../components/navigation/FloatingDockBar';
import { AppHeader } from '../components/navigation/AppHeader';

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <MqttProvider>
          <DeviceProvider>
            <LogProvider>{children}</LogProvider>
          </DeviceProvider>
        </MqttProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

describe('Screen Definitions & Full App Render Verification', () => {
  it('renders full <App /> initially to SplashScreen without any runtime errors', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('ESP32 IoT Gateway');
    expect(html).toContain('BẢO MẬT &amp; THÔNG MINH');
    expect(html).toContain('Vào Dashboard');
  });

  it('renders global AppHeader with robot avatar, greeting, date, and toggles', () => {
    const html = renderToStaticMarkup(
      <TestWrapper>
        <AppHeader />
      </TestWrapper>
    );
    expect(html).toContain('Xin chào Ye Min');
    expect(html).toContain('VI');
  });

  it('renders DashboardScreen + AppHeader + FloatingDockBar inside full provider tree without errors', () => {
    const html = renderToStaticMarkup(
      <TestWrapper>
        <AppHeader />
        <DashboardScreen />
        <FloatingDockBar currentTab="home" onSelectTab={() => {}} />
      </TestWrapper>
    );
    expect(html).toContain('Xin chào Ye Min');
    expect(html).toContain('+35%');
    expect(html).toContain('Đèn Chiếu Sáng');
    expect(html).toContain('Cửa Thông Minh');
  });

  it('renders ActivityLogScreen with SystemAuditCard inside full provider tree without errors', () => {
    const html = renderToStaticMarkup(
      <TestWrapper>
        <ActivityLogScreen />
      </TestWrapper>
    );
    expect(html).toContain('Nhật Ký Sự Kiện');
    expect(html).toContain('GIÁM SÁT HỆ THỐNG');
    expect(html).toContain('Chưa có sự kiện nào');
  });

  it('renders SettingsScreen inside full provider tree without errors', () => {
    const html = renderToStaticMarkup(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>
    );
    expect(html).toContain('Cài Đặt Hệ Thống');
    expect(html).toContain('Cấu Hình MQTT Broker EMQX');
  });
});
