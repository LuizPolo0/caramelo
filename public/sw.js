const CACHE = 'caramelo-v2'

self.addEventListener('install', e => { self.skipWaiting() })
self.addEventListener('activate', e => { self.clients.claim() })

self.addEventListener('message', e => {
  if (e.data?.type !== 'PUSH_NOTIFICATION') return
  const { title, body, url, urgent } = e.data
  self.registration.showNotification(title, {
    body, icon: '/favicon.ico', badge: '/favicon.ico',
    data: { url }, vibrate: [200, 100, 200],
    requireInteraction: urgent || false,
    actions: [{ action:'ver', title:'Ver ocorrência' }, { action:'fechar', title:'Fechar' }]
  })
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  if (e.action === 'fechar') return
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    self.clients.matchAll({ type:'window' }).then(clients => {
      const c = clients.find(c => c.url.includes(self.location.origin))
      if (c) { c.navigate(url); c.focus() }
      else self.clients.openWindow(url)
    })
  )
})
