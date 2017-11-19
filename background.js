/* global browser */

/**
 * Управление вкладками
 */
class TabManager {
  /**
   * Создаёт нового управляющего.
   */
  constructor () {
    /**
     * Сведения об текущих вкладок в разных окнах.
     */
    this.activeTabs = {}

    browser.tabs.onActivated.addListener((tabInfo) => {
      this.onTabActivated(tabInfo)
    })

    browser.tabs.onMoved.addListener((tabId, moveInfo) => {
      this.onTabMoved(tabId, moveInfo)
    })
  }

  /**
   * Активирует вкладку.
   *
   * @param {Number} tabId
   */
  activateTab (tabId) {
    console.log(`[TabManager.activateTab] ID: ${tabId}`)
    browser.tabs.update(tabId, {active: true})
  }

  /**
   * Возвращает активную вкладку указанного окна.
   *
   * @param {Number} windowId Идентификатор окна.
   *
   * @return {TabsTab|null}
   */
  getActiveTab (windowId) {
    if (this.activeTabs[windowId] !== undefined) {
      return this.activeTabs[windowId]
    }

    return null
  }

  /**
   * Следит за активацией вкладок.
   *
   * @param {TabsActiveInfo} tabInfo
   */
  onTabActivated (tabInfo) {
    console.log(`[TabManager.onTabActivated] ID: ${tabInfo.tabId}`)
    browser.tabs.get(tabInfo.tabId).then((tab) => {
      this.activeTabs[tab.windowId] = tab
    })
  }

  /**
   * Следит за перемещением вкладок.
   *
   * @param {Number} tabId
   * @param {TabsMoveInfo} tabInfo
   */
  onTabMoved (tabId, tabInfo) {
    console.log(`[TabManager.onTabMoved] ID: ${tabId}`)
    let activeTab = this.activeTabs[tabInfo.windowId]
    if (activeTab !== undefined && activeTab.id === tabId) {
      this.activeTabs[tabInfo.windowId].index = tabInfo.toIndex
    }
  }
}

/**
 * Абстрактная стратегия управления вкладками.
 */
class AbstractTabStrategy {
  /**
   * Создаёт новый экземпляр стратегии.
   *
   * @param {TabManager} tabManager
   */
  constructor (tabManager) {
    this.tabManager = tabManager
  }

  /**
   * Активирует стратегию.
   */
  activate () {
  }

  /**
   * Деактивирует стратегию.
   */
  // deactivate () {
  // }
}

/**
 * Стратегия открытия новых вкладок.
 */
class NewTabStrategy extends AbstractTabStrategy {
}

/**
 * Открывает новую вкладку сразу за текущей.
 */
class NewTabNextStrategy extends NewTabStrategy {
  /**
   * Активирует стратегию.
   */
  activate () {
    browser.tabs.onCreated.addListener((tab) => {
      this.onTabCreated(tab)
    })
  }

  /**
   * Обрабатывает событие создания новой вкладки>
   *
   * @params {tabs.Tab} tab
   */
  onTabCreated (tab) {
    console.log(`[NewTabStrategy.onTabCreated] ID: ${tab.id}, index: ${tab.index}`)
    let activeTab = this.tabManager.getActiveTab(tab.windowId)
    if (activeTab) {
      let newIndex = activeTab.index + 1
      console.log(`[NewTabStrategy.onTabCreated] Moving tab ${tab.id} to index: ${newIndex}`)
      browser.tabs.move(tab.id, {index: newIndex})
    }
  }
}

/**
 * Стратегия закрытия вкладок.
 */
class RemoveTabStrategy extends AbstractTabStrategy {
}

/**
 * Активирует вкладку слева от закрытой.
 */
class RemoveTabActivateLeftStrategy extends RemoveTabStrategy {
  /**
   * Активирует стратегию.
   */
  activate () {
    browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
      this.onTabRemoved(tabId, removeInfo)
    })
  }

  /**
   * @param {Number} tabId
   * @param {TabsRemoveInfo} removeInfo
   */
  onTabRemoved (tabId, removeInfo) {
    console.log(`[RemoveTabActivateLeftStrategy.onTabRemoved] ID: ${tabId}`)
    let activeTab = this.tabManager.getActiveTab(removeInfo.windowId)
    if (activeTab) {
      if (tabId === activeTab.id && !removeInfo.isWindowClosing) {
        console.log(`[RemoveTabActivateLeftStrategy.onTabRemoved] found active tab: ${activeTab.id}`)
        browser.tabs.query({windowId: activeTab.windowId, index: activeTab.index - 1}).then((tabs) => {
          if (tabs.length > 0) {
            console.log(
              `[RemoveTabActivateLeftStrategy.onTabRemoved] Changing focus to ${tabs[0].index}`)
            this.tabManager.activateTab(tabs[0].id)
          } else {
            console.log('[RemoveTabActivateLeftStrategy.onTabRemoved] No tabs found')
          }
        })
      }
    }
  }
}

let tabManager = new TabManager()
let newTabStrategy = new NewTabNextStrategy(tabManager)
let removeTabStrategy = new RemoveTabActivateLeftStrategy(tabManager)

newTabStrategy.activate()
removeTabStrategy.activate()
