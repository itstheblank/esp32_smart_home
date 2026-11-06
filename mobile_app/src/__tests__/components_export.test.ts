import { describe, it, expect } from 'vitest';
import { AppIcons } from '../components/common/AppIcons';
import { translations } from '../constants/translations';
import {
  SystemAuditCard,
  LightControlCard,
  DoorSecurityCard,
  MotionRadarCard,
  RfidAccessCard,
  EnergyBanner,
} from '../components/cards';
import {
  SplashScreen,
  DashboardScreen,
  ActivityLogScreen,
  SettingsScreen,
} from '../screens';
import { FloatingDockBar } from '../components/navigation/FloatingDockBar';
import { SafeShield } from '../components/navigation/SafeShield';
import { AppHeader } from '../components/navigation/AppHeader';
import { RobotAvatar } from '../components/common/RobotAvatar';
import { InAppNotificationToast } from '../components/common/InAppNotificationToast';
import { QuickActionsModal } from '../components/common/QuickActionsModal';

describe('Component Module & UI Exports Integrity', () => {
  it('exports all critical AppIcons functions', () => {
    expect(typeof AppIcons.Home).toBe('function');
    expect(typeof AppIcons.HomeOutline).toBe('function');
    expect(typeof AppIcons.Events).toBe('function');
    expect(typeof AppIcons.Settings).toBe('function');
    expect(typeof AppIcons.Plus).toBe('function');
    expect(typeof AppIcons.LightbulbOn).toBe('function');
    expect(typeof AppIcons.LightbulbOff).toBe('function');
    expect(typeof AppIcons.DoorOpen).toBe('function');
    expect(typeof AppIcons.DoorClosed).toBe('function');
    expect(typeof AppIcons.MotionSensor).toBe('function');
    expect(typeof AppIcons.RfidCard).toBe('function');
    expect(typeof AppIcons.ShieldCheck).toBe('function');
    expect(typeof AppIcons.ShieldAlert).toBe('function');
    expect(typeof AppIcons.FlashEnergy).toBe('function');
    expect(typeof AppIcons.Fingerprint).toBe('function');
  });

  it('exports all 6 device cards in Chặng 2', () => {
    expect(SystemAuditCard).toBeDefined();
    expect(LightControlCard).toBeDefined();
    expect(DoorSecurityCard).toBeDefined();
    expect(MotionRadarCard).toBeDefined();
    expect(RfidAccessCard).toBeDefined();
    expect(EnergyBanner).toBeDefined();
  });

  it('exports all navigation and common elements in Chặng 1 & 3', () => {
    expect(FloatingDockBar).toBeDefined();
    expect(SafeShield).toBeDefined();
    expect(AppHeader).toBeDefined();
    expect(RobotAvatar).toBeDefined();
    expect(InAppNotificationToast).toBeDefined();
    expect(QuickActionsModal).toBeDefined();
  });

  it('exports all 4 full screens in Chặng 4', () => {
    expect(SplashScreen).toBeDefined();
    expect(DashboardScreen).toBeDefined();
    expect(ActivityLogScreen).toBeDefined();
    expect(SettingsScreen).toBeDefined();
  });

  it('contains quick actions and audit labels in translations', () => {
    expect(translations.vi.quickActionsTitle).toBe('Thao Tác Nhanh');
    expect(translations.en.quickActionsTitle).toBe('Quick Actions');
    expect(translations.vi.auditLabel).toBe('GIÁM SÁT HỆ THỐNG');
    expect(translations.en.auditLabel).toBe('SYSTEM AUDIT');
    expect(translations.vi.quickActionArmAll).toBeDefined();
    expect(translations.vi.quickActionLightsOff).toBeDefined();
  });
});

