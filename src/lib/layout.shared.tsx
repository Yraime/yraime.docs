import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { FaYoutube, FaTiktok, FaDiscord } from 'react-icons/fa';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
    },

    links: [
      {
        type: 'icon',
        label: 'YouTube',
        text: "GitHub",
        icon: <FaYoutube size={20} />,
        url: 'https://www.youtube.com/@yraime',
      },
      {
        type: 'icon',
        label: 'TikTok',
        text: "GitHub",
        icon: <FaTiktok size={20} />,
        url: 'https://www.tiktok.com/@yraime.off',
      },
      {
        type: 'icon',
        label: 'Discord',
        text: "GitHub",
        icon: <FaDiscord size={20} />,
        url: 'https://discord.gg/DFgCdV4SNt',
      },
    ],

    // Correction de la syntaxe de votre template string GitHub qui avait un oubli de '$'
    githubUrl: `https://github.com/Yraime`,

    searchToggle: {
      enabled: false,
    },

    themeSwitch: {
      enabled: false,
    },
  };
}
