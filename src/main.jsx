import { useCallback, useState } from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import VirtualTVRemote from './components/VirtualTVRemote';
import {
  loadFreeCountrySort,
  saveFreeCountrySort,
} from './utils/homeGrid';
import { loadUserType, saveUserType } from './utils/userType';

function AppShell() {
  const [activeSection, setActiveSection] = useState('Apps');
  const [userType, setUserType] = useState(() => loadUserType());
  const [freeCountrySort, setFreeCountrySort] = useState(() => loadFreeCountrySort());
  const [hasSignedIn, setHasSignedIn] = useState(false);
  const [homeLoadingComplete, setHomeLoadingComplete] = useState(false);
  const [upsellReturnFocus, setUpsellReturnFocus] = useState(null);
  const [upsellCountryName, setUpsellCountryName] = useState('United States');
  const [welcomeSkipIntro, setWelcomeSkipIntro] = useState(false);

  const handleUserTypeChange = useCallback((nextUserType) => {
    setUserType(nextUserType);
    saveUserType(nextUserType);
  }, []);

  const handleFreeCountrySortChange = useCallback((nextSort) => {
    setFreeCountrySort(nextSort);
    saveFreeCountrySort(nextSort);
  }, []);

  const handleSignIn = useCallback(() => {
    setHasSignedIn(true);
    setActiveSection('Home');
  }, []);

  const handleNavigateToUpsell = useCallback((returnFocus) => {
    setUpsellReturnFocus(returnFocus);
    setUpsellCountryName(returnFocus.countryName ?? 'United States');
    setActiveSection('Upsell');
  }, []);

  const handleLeaveUpsell = useCallback(() => {
    setActiveSection(upsellReturnFocus?.section ?? 'Home');
  }, [upsellReturnFocus]);

  const handleUpsellReturnFocusHandled = useCallback(() => {
    setUpsellReturnFocus(null);
  }, []);

  const handleHomeLoadingComplete = useCallback(() => {
    setHomeLoadingComplete(true);
  }, []);

  const handleSignOut = useCallback(() => {
    setHasSignedIn(false);
    setHomeLoadingComplete(false);
    setWelcomeSkipIntro(true);
    setActiveSection('Welcome');
  }, []);

  const handleOpenWelcome = useCallback(() => {
    setWelcomeSkipIntro(false);
    setActiveSection('Welcome');
  }, []);

  return (
    <>
      <App
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userType={userType}
        freeCountrySort={freeCountrySort}
        hasSignedIn={hasSignedIn}
        showInitialLoading={hasSignedIn && !homeLoadingComplete}
        onSignIn={handleSignIn}
        onHomeLoadingComplete={handleHomeLoadingComplete}
        onNavigateToUpsell={handleNavigateToUpsell}
        onLeaveUpsell={handleLeaveUpsell}
        upsellReturnFocus={upsellReturnFocus}
        upsellCountryName={upsellCountryName}
        onUpsellReturnFocusHandled={handleUpsellReturnFocusHandled}
        welcomeSkipIntro={welcomeSkipIntro}
        onSignOut={handleSignOut}
        onOpenWelcome={handleOpenWelcome}
      />
      <VirtualTVRemote
        onNavigate={setActiveSection}
        activeSection={activeSection}
        userType={userType}
        onUserTypeChange={handleUserTypeChange}
        freeCountrySort={freeCountrySort}
        onFreeCountrySortChange={handleFreeCountrySortChange}
      />
    </>
  );
}

AppRegistry.registerComponent('VegaPrototype', () => AppShell);
AppRegistry.runApplication('VegaPrototype', {
  rootTag: document.getElementById('root'),
});
