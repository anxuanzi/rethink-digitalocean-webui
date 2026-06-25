<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { FetchError } from 'ofetch'

const open = defineModel<boolean>('open', { default: false })

const { addToken } = useDoAuth()

const schema = z.object({
  token: z.string().min(1, 'Paste a DigitalOcean API token')
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ token: '' })
const loading = ref(false)
const error = ref('')

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  error.value = ''
  try {
    await addToken(event.data.token)
    state.token = ''
    open.value = false
  } catch (err) {
    error.value = err instanceof FetchError
      ? (err.data?.message ?? err.statusMessage ?? 'Could not verify token')
      : 'Could not verify token'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Add a team"
    description="Paste a DigitalOcean Personal Access Token. We'll verify it and add its team."
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UForm
        id="add-team-form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          name="token"
          label="Personal Access Token"
        >
          <UInput
            v-model="state.token"
            type="password"
            placeholder="dop_v1_…"
            icon="i-lucide-key-round"
            autocomplete="off"
            class="w-full"
          />
        </UFormField>

        <p
          v-if="error"
          class="text-sm text-error flex items-center gap-1.5"
        >
          <UIcon
            name="i-lucide-alert-circle"
            class="size-4 shrink-0"
          />
          {{ error }}
        </p>
      </UForm>
    </template>

    <template #footer="{ close }">
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        @click="close"
      />
      <UButton
        type="submit"
        form="add-team-form"
        label="Add team"
        :loading="loading"
      />
    </template>
  </UModal>
</template>
