import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from './Styles/colors';
import { TV_HEIGHT, TV_WIDTH } from './Styles/viewport';
import AppLauncher from './pages/AppLauncher';
import ComponentLibrary from './pages/ComponentLibrary';
import FallbackSignIn from './pages/FallbackSignIn';
import Home from './pages/Home';
import Search from './pages/Search';
import Settings from './pages/Settings';
import SignIn from './pages/SignIn';
import Upsell from './pages/Upsell';
import Welcome from './pages/Welcome';

export default function App({
  activeSection = 'Home',
  onSectionChange = () => {},
  userType = 'paid',
  freeCountrySort = 'alphabetical',
  hasSignedIn = false,
  showInitialLoading = false,
  onSignIn = () => {},
  onHomeLoadingComplete = () => {},
  onNavigateToUpsell = () => {},
  onLeaveUpsell = () => {},
  upsellReturnFocus = null,
  upsellCountryName = 'United States',
  onUpsellReturnFocusHandled = () => {},
  welcomeSkipIntro = false,
  onSignOut = () => {},
  onOpenWelcome = () => {},
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' && event.key !== 'Backspace') {
        return;
      }

      if (activeSection === 'Apps') {
        event.preventDefault();
        onSectionChange('Home');
        return;
      }

      if (activeSection === 'Welcome') {
        event.preventDefault();
        onSectionChange('Apps');
        return;
      }

      if (activeSection === 'SignIn') {
        event.preventDefault();
        onSectionChange('Welcome');
        return;
      }

      if (activeSection === 'FallbackSignIn') {
        event.preventDefault();
        onSectionChange('SignIn');
        return;
      }

      if (activeSection === 'Upsell') {
        event.preventDefault();
        onLeaveUpsell();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [activeSection, onLeaveUpsell, onSectionChange]);

  if (activeSection === 'Apps') {
    return (
      <View style={styles.screen}>
        <AppLauncher onOpenWelcome={onOpenWelcome} />
      </View>
    );
  }

  if (activeSection === 'Welcome') {
    return (
      <View style={styles.screen}>
        <Welcome
          skipIntro={welcomeSkipIntro}
          onSignIn={() => onSectionChange('SignIn')}
        />
      </View>
    );
  }

  if (activeSection === 'SignIn') {
    return (
      <View style={styles.screen}>
        <SignIn
          onQrScanned={onSignIn}
          onTroubleSigningIn={() => onSectionChange('FallbackSignIn')}
        />
      </View>
    );
  }

  if (activeSection === 'FallbackSignIn') {
    return (
      <View style={styles.screen}>
        <FallbackSignIn />
      </View>
    );
  }

  if (activeSection === 'ComponentLibrary') {
    return (
      <View style={styles.screen}>
        <ComponentLibrary onBack={() => onSectionChange('Home')} />
      </View>
    );
  }

  if (activeSection === 'Upsell') {
    return (
      <View style={styles.screen}>
        <Upsell countryName={upsellCountryName} />
      </View>
    );
  }

  if (activeSection === 'Settings') {
    return (
      <View style={styles.screen}>
        <Settings
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onSignOut={onSignOut}
          userType={userType}
        />
      </View>
    );
  }

  if (activeSection === 'Search') {
    return (
      <View style={styles.screen}>
        <Search
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onNavigateToUpsell={onNavigateToUpsell}
          upsellReturnFocus={upsellReturnFocus}
          onUpsellReturnFocusHandled={onUpsellReturnFocusHandled}
          userType={userType}
        />
      </View>
    );
  }

  return (
    <Home
      activeSection={activeSection}
      onSectionChange={onSectionChange}
      userType={userType}
      freeCountrySort={freeCountrySort}
      showInitialLoading={showInitialLoading}
      onInitialLoadingComplete={onHomeLoadingComplete}
      onNavigateToUpsell={onNavigateToUpsell}
      upsellReturnFocus={upsellReturnFocus}
      onUpsellReturnFocusHandled={onUpsellReturnFocusHandled}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: colors.backgroundDeep,
    overflow: 'visible',
  },
});
