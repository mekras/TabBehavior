/* global browser, tabs */

/**
 * Индексы текущих вкладок в разных окнах.
 */
let activeTabIndexes = {}

/**
 * Признак того, что надо отработать закрытие вкладки.
 */
let onClose = false

/**
 * Запоминает или меняет активные вкладки.
 *
 * @param {tabs.TabInfo} tabInfo
 */
function onTabActivated (tabInfo) {
  browser.tabs.get(tabInfo.tabId).then((tab) => {
    if (onClose) {
      onClose = false
      browser.tabs.query({index: tab.index - 2}).then((tabs) => {
        if (tabs.length > 0) {
          browser.tabs.update(tabs[0].id, {active: true})
        }
      })
    } else {
      activeTabIndexes[tab.windowId] = tab.index
    }
  })
}

/**
 * @params {tabs.Tab} tab
 */
function onTabCreated (tab) {
  let index = -1
  if (activeTabIndexes[tab.windowId] !== undefined) {
    index = activeTabIndexes[tab.windowId] + 1
  }
  browser.tabs.move(tab.id, {index: index})
}

/**
 * @param {Number} tabId
 * @param {tabs.RemoveInfo} removeInfo
 */
function onTabRemoved (tabId, removeInfo) {
  if (!removeInfo.isWindowClosing) {
    onClose = true
  }
}

browser.tabs.onActivated.addListener(onTabActivated)
browser.tabs.onCreated.addListener(onTabCreated)
browser.tabs.onRemoved.addListener(onTabRemoved)
