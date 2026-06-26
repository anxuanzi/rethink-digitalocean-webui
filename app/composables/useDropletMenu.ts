import type { DropdownMenuItem } from '@nuxt/ui'
import type { Droplet } from '~/types/droplet'
import ResizeDropletModal from '~/components/droplets/ResizeDropletModal.vue'
import SnapshotDropletModal from '~/components/droplets/SnapshotDropletModal.vue'
import RebuildDropletModal from '~/components/droplets/RebuildDropletModal.vue'
import RenameDropletModal from '~/components/droplets/RenameDropletModal.vue'
import DropletNoteModal from '~/components/droplets/DropletNoteModal.vue'
import DestroyDropletModal from '~/components/droplets/DestroyDropletModal.vue'

/**
 * Shared Droplet action menu + modal openers, used by both the list rows and the detail header
 * so the available actions are identical everywhere. Power actions run directly (optimistic);
 * the rest open a programmatic overlay modal.
 */
export function useDropletMenu() {
  const overlay = useOverlay()
  const actions = useDropletActions()
  const notes = useDropletNotesStore()

  const resizeModal = overlay.create(ResizeDropletModal)
  const snapshotModal = overlay.create(SnapshotDropletModal)
  const rebuildModal = overlay.create(RebuildDropletModal)
  const renameModal = overlay.create(RenameDropletModal)
  const noteModal = overlay.create(DropletNoteModal)
  const destroyModal = overlay.create(DestroyDropletModal)

  const openResize = (d: Droplet) => resizeModal.open({ droplet: d })
  const openSnapshot = (d: Droplet) => snapshotModal.open({ droplet: d })
  const openRebuild = (d: Droplet) => rebuildModal.open({ droplet: d })
  const openRename = (d: Droplet) => renameModal.open({ droplet: d })
  const openNote = (d: Droplet) => noteModal.open({ droplet: d })
  const openDestroy = (d: Droplet) => destroyModal.open({ droplet: d })

  /** The full ⋮ menu for a Droplet. */
  function menuItems(d: Droplet): DropdownMenuItem[][] {
    const isOff = d.status === 'off'
    return [
      [
        isOff
          ? { label: 'Power on', icon: 'i-lucide-power', onSelect: () => actions.powerOn(d) }
          : { label: 'Power off', icon: 'i-lucide-power-off', onSelect: () => actions.powerOff(d) },
        { label: 'Reboot', icon: 'i-lucide-rotate-cw', onSelect: () => actions.reboot(d) },
        { label: 'Resize', icon: 'i-lucide-scaling', onSelect: () => openResize(d) }
      ],
      [
        { label: 'Take snapshot', icon: 'i-lucide-camera', onSelect: () => openSnapshot(d) },
        { label: 'Rebuild', icon: 'i-lucide-refresh-cw', onSelect: () => openRebuild(d) },
        { label: 'Rename', icon: 'i-lucide-pencil', onSelect: () => openRename(d) },
        {
          label: notes.hasNote(d.id) ? 'Edit note' : 'Add note',
          icon: 'i-lucide-sticky-note',
          onSelect: () => openNote(d)
        }
      ],
      [
        { label: 'Destroy', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openDestroy(d) }
      ]
    ]
  }

  return { menuItems, openResize, openSnapshot, openRebuild, openRename, openNote, openDestroy }
}
