import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Menu from '../components/Menu';
import SideNav from '../components/SideNav';
import SettingsQrPage from './settings/SettingsQrPage';
import SignOutModal from './settings/SignOutModal';
import TermsOfService from './settings/TermsOfService';
import { colors } from '../Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from '../Styles/viewport';
import { USER_TYPES } from '../utils/userType';

import signOutIcon from '../assets/icons/ic-arrow-out-from-rectangle.svg?raw';
import codeIcon from '../assets/icons/ic-code.svg?raw';
import fileIcon from '../assets/icons/ic-file.svg?raw';
import speechBubbleIcon from '../assets/icons/ic-speech-bubble.svg?raw';

const SETTINGS_ITEMS = [
  { id: 'contact', label: 'Contact us', icon: speechBubbleIcon },
  { id: 'privacy', label: 'Privacy policy', icon: fileIcon },
  { id: 'terms', label: 'Terms of service', icon: fileIcon },
  { id: 'logs', label: 'View logs', icon: codeIcon },
  { id: 'sign-out', label: 'Sign out', icon: signOutIcon },
];

const ACCOUNT_INFO = {
  [USER_TYPES.PAID]: {
    email: 'eric.norbert@proton.me',
    plan: 'Proton VPN Plus',
  },
  [USER_TYPES.FREE]: {
    email: 'notbert@protonmail.com',
    plan: 'Proton Free',
  },
};

const APP_VERSION = '0.0.0.0';

const SETTINGS_ITEM_INDEX = Object.fromEntries(
  SETTINGS_ITEMS.map((item, index) => [item.id, index]),
);

const SETTINGS_SUB_PAGES = {
  contact: {
    title: 'Contact us',
    body:
      'Visit our online Support Center for troubleshooting tips, setup guides, and answers to FAQs. Scan the QR code or go to: ',
    link: 'proton.me/support',
  },
  privacy: {
    title: 'Privacy policy',
    body: 'To read our privacy policy, scan the QR code or go to: ',
    link: 'proton.me/legal/privacy',
  },
};

function handleSettingsItemPress(itemId) {
  switch (itemId) {
    case 'contact':
      return 'contact';
    case 'privacy':
      return 'privacy';
    case 'terms':
      return 'terms';
    default:
      return null;
  }
}

export default function Settings({
  activeSection = 'Settings',
  onSectionChange = () => {},
  onSignOut = () => {},
  userType = USER_TYPES.PAID,
}) {
  const [navExpanded, setNavExpanded] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const menuItemRefs = useRef([]);
  const contentFocusRef = useRef(0);
  const focusedIndexRef = useRef(0);

  const account = ACCOUNT_INFO[userType] ?? ACCOUNT_INFO[USER_TYPES.PAID];

  const focusMenuItem = useCallback((index) => {
    focusedIndexRef.current = index;
    contentFocusRef.current = index;
    menuItemRefs.current[index]?.focus?.({ preventScroll: true });
  }, []);

  const handleCloseSubPage = useCallback(() => {
    setActiveSubPage(null);
    requestAnimationFrame(() => focusMenuItem(focusedIndexRef.current));
  }, [focusMenuItem]);

  const handleCloseSignOutModal = useCallback(() => {
    setShowSignOutModal(false);
    requestAnimationFrame(() => focusMenuItem(focusedIndexRef.current));
  }, [focusMenuItem]);

  const releaseContentFocus = useCallback(() => {
    contentFocusRef.current = null;
    menuItemRefs.current[focusedIndexRef.current]?.blur?.();
  }, []);

  const handleExitNavFocus = useCallback(() => {
    focusMenuItem(focusedIndexRef.current);
  }, [focusMenuItem]);

  useEffect(() => {
    requestAnimationFrame(() => focusMenuItem(0));
  }, [focusMenuItem]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showSignOutModal) {
        return;
      }

      if (activeSubPage) {
        if (event.key === 'Escape' || event.key === 'Backspace') {
          event.preventDefault();
          handleCloseSubPage();
        }
        return;
      }

      if (navExpanded) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        releaseContentFocus();
        return;
      }

      if (event.key === 'ArrowDown') {
        const next = Math.min(
          SETTINGS_ITEMS.length - 1,
          focusedIndexRef.current + 1,
        );
        if (next !== focusedIndexRef.current) {
          focusMenuItem(next);
          event.preventDefault();
        }
        return;
      }

      if (event.key === 'ArrowUp') {
        const prev = Math.max(0, focusedIndexRef.current - 1);
        if (prev !== focusedIndexRef.current) {
          focusMenuItem(prev);
          event.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    activeSubPage,
    focusMenuItem,
    handleCloseSubPage,
    navExpanded,
    releaseContentFocus,
    showSignOutModal,
  ]);

  if (activeSubPage === 'terms') {
    return <TermsOfService />;
  }

  if (activeSubPage && SETTINGS_SUB_PAGES[activeSubPage]) {
    const subPage = SETTINGS_SUB_PAGES[activeSubPage];
    return (
      <SettingsQrPage
        title={subPage.title}
        body={subPage.body}
        link={subPage.link}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <SideNav
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onExpandedChange={setNavExpanded}
        onExitFocus={handleExitNavFocus}
        tileFocusRef={contentFocusRef}
      />

      <View style={styles.content}>
        <View style={styles.menuColumn}>
          {SETTINGS_ITEMS.map((item, index) => (
            <Menu
              key={item.id}
              ref={(node) => {
                menuItemRefs.current[index] = node;
              }}
              label={item.label}
              icon={item.icon}
              hasTVPreferredFocus={index === 0}
              onPress={() => {
                if (item.id === 'sign-out') {
                  focusedIndexRef.current = index;
                  setShowSignOutModal(true);
                  return;
                }

                const subPage = handleSettingsItemPress(item.id);
                if (subPage) {
                  focusedIndexRef.current =
                    SETTINGS_ITEM_INDEX[item.id] ?? focusedIndexRef.current;
                  setActiveSubPage(subPage);
                }
              }}
              onFocus={() => {
                focusedIndexRef.current = index;
                contentFocusRef.current = index;
              }}
            />
          ))}

          <View style={styles.caption}>
            <View style={styles.account}>
              <Text style={styles.email}>{account.email}</Text>
              <Text style={styles.plan}>{account.plan}</Text>
            </View>
            <Text style={styles.version}>App version: {APP_VERSION}</Text>
          </View>
        </View>
      </View>

      {showSignOutModal && (
        <SignOutModal
          onCancel={handleCloseSignOutModal}
          onSignOut={onSignOut}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: colors.backgroundDeep,
    overflow: 'visible',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 35,
  },
  menuColumn: {
    width: 800,
    gap: 24,
    alignItems: 'center',
  },
  caption: {
    width: 800,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  account: {
    gap: 4,
  },
  email: {
    fontSize: 25,
    fontWeight: '500',
    lineHeight: 25,
    color: colors.textNorm,
  },
  plan: {
    fontSize: 25,
    fontWeight: '400',
    lineHeight: 32,
    color: colors.textWeak,
  },
  version: {
    fontSize: 25,
    fontWeight: '400',
    lineHeight: 32,
    color: colors.textWeak,
  },
});
