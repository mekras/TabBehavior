/* global browser */

/**
 * Сведения об текущих вкладок в разных окнах.
 */
let activeTabs = {}

/**
 * Признак того, что надо отработать закрытие вкладки.
 */
let onClose = false

/**
 * Запоминает или меняет активные вкладки.
 *
 * @param {tabs.ActiveInfo} tabInfo
 */
function onTabActivated (tabInfo) {
  console.log('onTabActivated', arguments)
  if (onClose) {
    console.log('onTabActivated: changing focus')
    onClose = false
    if (activeTabs[tabInfo.windowId] === undefined) {
      console.log('onTabActivated: no active tab info')
      return
    }
    browser.tabs.query({index: activeTabs[tabInfo.windowId].index - 1}).then((tabs) => {
      if (tabs.length > 0) {
        console.log(`onTabActivated: changing focus to ${tabs[0].index}`)
        browser.tabs.update(tabs[0].id, {active: true})
      } else {
        console.log('onTabActivated: no tabs found')
      }
    })
  } else {
    browser.tabs.get(tabInfo.tabId).then((tab) => {
      activeTabs[tab.windowId] = {id: tab.id, index: tab.index}
    })
  }
}

/**
 * @params {tabs.Tab} tab
 */
function onTabCreated (tab) {
  console.log('onTabCreated', arguments)
  let index = -1
  if (activeTabs[tab.windowId] !== undefined) {
    index = activeTabs[tab.windowId].index + 1
  }
  browser.tabs.move(tab.id, {index: index})
}

/**
 * @param {Number} tabId
 * @param {tabs.RemoveInfo} removeInfo
 */
function onTabRemoved (tabId, removeInfo) {
  console.log('onTabRemoved', arguments)
  if (activeTabs[removeInfo.windowId] === undefined) {
    return
  }
  if (tabId === activeTabs[removeInfo.windowId].id && !removeInfo.isWindowClosing) {
    console.log('onTabRemoved: set change focus flag')
    onClose = true
  }
}

browser.tabs.onActivated.addListener(onTabActivated)
browser.tabs.onCreated.addListener(onTabCreated)
browser.tabs.onRemoved.addListener(onTabRemoved)
