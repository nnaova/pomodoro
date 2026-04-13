import styles from './Header.module.css'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { requestNotificationPermission } from '../../utils/notifications'

interface HeaderProps {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: HeaderProps) {
  const { soundEnabled, notificationsEnabled, theme, updateSettings } = usePomodoroStore()

  const toggleSound = () => {
    updateSettings({ soundEnabled: !soundEnabled })
  }

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission()
      if (granted) updateSettings({ notificationsEnabled: true })
    } else {
      updateSettings({ notificationsEnabled: false })
    }
  }

  const toggleTheme = () => {
    updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })
  }

  return (
    <header className={styles.header}>
      <button
        onClick={onSettingsClick}
        className={styles.iconBtn}
        aria-label="Paramètres"
      >
        ⚙
      </button>
      <div className={styles.right}>
        <button
          onClick={toggleSound}
          className={`${styles.iconBtn} ${!soundEnabled ? styles.inactive : ''}`}
          aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
          title={soundEnabled ? 'Son activé' : 'Son désactivé'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <button
          onClick={toggleNotifications}
          className={`${styles.iconBtn} ${!notificationsEnabled ? styles.inactive : ''}`}
          aria-label={notificationsEnabled ? 'Désactiver les notifications' : 'Activer les notifications'}
          title={notificationsEnabled ? 'Notifications activées' : 'Notifications désactivées'}
        >
          {notificationsEnabled ? '🔔' : '🔕'}
        </button>
        <button
          onClick={toggleTheme}
          className={styles.iconBtn}
          aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
