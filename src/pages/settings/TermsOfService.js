import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import StageBackground from '../../components/StageBackground';
import { colors } from '../../Styles/colors';
import { SCROLL_DURATION } from '../../Styles/motion';
import { TV_HEIGHT, TV_WIDTH } from '../../Styles/viewport';

const SCROLL_STEP = 300;
const VIEWPORT_LEFT = 460;
const VIEWPORT_TOP = 163;
const VIEWPORT_WIDTH = 1000;
const VIEWPORT_HEIGHT = 769;
const FADE_RATIO = 0.15;
const SCROLL_SMOOTH_TIME_S = SCROLL_DURATION / 1000 / 4.6;

function getScrollMask(showTopFade, showBottomFade, fadeRatio) {
  const fadePercent = fadeRatio * 100;
  const solidEnd = 100 - fadePercent;

  if (showTopFade && showBottomFade) {
    return `linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) ${fadePercent}%, rgba(0, 0, 0, 1) ${solidEnd}%, rgba(0, 0, 0, 0) 100%)`;
  }

  if (showTopFade) {
    return `linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) ${fadePercent}%, rgba(0, 0, 0, 1) 100%)`;
  }

  if (showBottomFade) {
    return `linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) ${solidEnd}%, rgba(0, 0, 0, 0) 100%)`;
  }

  return undefined;
}

const TERMS_CONTENT = `ProtonVPN App Store 1.1 License Agreement

ProtonVPN is free and open source software, built by Proton AG, rouete de la Galaise 32, 1228 Plan-les-Ouates, Switzerland and supported by a community of thousands from all over the world. There are a few things you should know:

- This executable version of ProtonVPN (the "ProtonVPN App") is made available to you under the terms of the GNU General Public License Version 3 (GPLv3) (https://www.gnu.org/licenses/gpl-3.0.en.html). This means you may use, copy and distribute the ProtonVPN App to others under the conditions of the license. The GPLv3 license also gives you the right to distribute vour modified versions under the conditions of the license. - You are not granted any trademark rights or licenses to the trademarks of Proton AG or any party, including without limitation the ProtonVPN name or logo. - How we use your personal information and feedback submitted to Proton AG through the ProtonVPN App is described in the Proton Privacy Policy (https://proton.me/legal/privacy). Your use of the ProtonVPN App is submitted to the acceptance of the Proton Terms of Service (https://proton.me/legal/terms). In this agreement, the term "Services" shall have the same meaning as under Proton Terms and Conditions.

1. Proton AG and you acknowledge that we're no strangers to love. You know the rules and so do IA full commitment's what I'm thinkin' of. You wouldn't get this from any other guy. Never gonna give you up, never gonna let you down, never gonna run around and desert you. Never gonna make you cry, never gonna say goodbye, never gonna tell a lie and hurt you.

This page is just a whole bunch of legal things that we'll go into detail about here in some dry legal language that will most likely bore you unless you speak fluent legalese and actually find this interesting. Not sure who that would be. Someone who works in the legal sector I imagine. Or maybe the most privacy concious of our users actually read this, but that's not what this is for. This is just a prototype, so there aren't really any licenses or stuf you need to agree to. Which makes me wonder, why are you still reading this? There's nothing interesting here. Go look at a different page.`;

export default function TermsOfService() {
  const scrollTargetRef = useRef(0);
  const displayScrollRef = useRef(0);
  const maxScrollRef = useRef(0);
  const [displayScrollOffset, setDisplayScrollOffset] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  const scrollBy = useCallback((delta) => {
    const next = Math.max(
      0,
      Math.min(maxScrollRef.current, scrollTargetRef.current + delta),
    );
    scrollTargetRef.current = next;
  }, []);

  useEffect(() => {
    maxScrollRef.current = maxScroll;
  }, [maxScroll]);

  useEffect(() => {
    let frameId;
    let lastTime = performance.now();

    const tick = (now) => {
      const target = scrollTargetRef.current;
      const current = displayScrollRef.current;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (current !== target) {
        const alpha = 1 - Math.exp(-dt / SCROLL_SMOOTH_TIME_S);
        let next = current + (target - current) * alpha;

        if (Math.abs(target - next) < 0.5) {
          next = target;
        }

        displayScrollRef.current = next;
        setDisplayScrollOffset(next);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowDown') {
        scrollBy(SCROLL_STEP);
        event.preventDefault();
        return;
      }

      if (event.key === 'ArrowUp') {
        scrollBy(-SCROLL_STEP);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [scrollBy]);

  const showTopFade = maxScroll > 0 && displayScrollOffset > 0;
  const showBottomFade =
    maxScroll > 0 && displayScrollOffset < maxScroll - 0.5;
  const scrollMask = getScrollMask(showTopFade, showBottomFade, FADE_RATIO);

  return (
    <View style={styles.screen}>
      <StageBackground />

      <View
        style={[
          styles.scrollViewport,
          {
            left: VIEWPORT_LEFT,
            top: VIEWPORT_TOP,
            width: VIEWPORT_WIDTH,
            height: VIEWPORT_HEIGHT,
          },
          scrollMask && {
            WebkitMaskImage: scrollMask,
            maskImage: scrollMask,
          },
        ]}
      >
        <View
          style={[
            styles.scrollContent,
            {
              transform: [{ translateY: -displayScrollOffset }],
            },
          ]}
        >
          <Text
            style={styles.text}
            onLayout={(event) => {
              const height = event.nativeEvent.layout.height;
              setMaxScroll(Math.max(0, height - VIEWPORT_HEIGHT));
            }}
          >
            {TERMS_CONTENT}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: TV_WIDTH,
    height: TV_HEIGHT,
    backgroundColor: colors.backgroundDeep,
    overflow: 'hidden',
  },
  scrollViewport: {
    position: 'absolute',
    overflow: 'hidden',
  },
  scrollContent: {
    width: VIEWPORT_WIDTH,
  },
  text: {
    width: VIEWPORT_WIDTH,
    fontSize: 29,
    fontWeight: '400',
    lineHeight: 36,
    color: colors.textNorm,
  },
});
