import type { DropdownMenuItem } from '@nuxt/ui'
import type { DatabaseCluster } from '~/types/database'
import ResizeDatabaseModal from '~/components/databases/ResizeDatabaseModal.vue'
import DestroyDatabaseModal from '~/components/databases/DestroyDatabaseModal.vue'

/**
 * Shared cluster action menu + modal openers, used by both the list cards and the detail header so
 * the available actions are identical everywhere. Resize/destroy open a programmatic overlay modal.
 */
export function useDatabaseMenu() {
  const overlay = useOverlay()

  const resizeModal = overlay.create(ResizeDatabaseModal)
  const destroyModal = overlay.create(DestroyDatabaseModal)

  const openResize = (c: DatabaseCluster) => resizeModal.open({ database: c })
  const openDestroy = (c: DatabaseCluster) => destroyModal.open({ database: c })

  function menuItems(c: DatabaseCluster): DropdownMenuItem[][] {
    return [
      [
        { label: 'Open', icon: 'i-lucide-arrow-up-right', onSelect: () => navigateTo(`/database/${c.id}`) },
        { label: 'Resize', icon: 'i-lucide-scaling', onSelect: () => openResize(c) }
      ],
      [
        { label: 'Destroy', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openDestroy(c) }
      ]
    ]
  }

  return { menuItems, openResize, openDestroy }
}
