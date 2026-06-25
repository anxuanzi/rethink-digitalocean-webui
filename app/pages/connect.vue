<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { FetchError } from 'ofetch'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Connect' })

const { addToken } = useDoAuth()

const schema = z.object({
  token: z.string().min(1, 'Paste your DigitalOcean API token')
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
    await navigateTo('/')
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
  <div class="space-y-8">
    <div class="space-y-3 text-center">
      <div class="size-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
        <UIcon
          name="i-simple-icons-digitalocean"
          class="size-7 text-primary"
        />
      </div>
      <div class="space-y-1">
        <h1 class="text-xl font-semibold text-highlighted">
          Connect to DigitalOcean
        </h1>
        <p class="text-sm text-muted text-balance">
          Paste a Personal Access Token to manage your team's resources.
        </p>
      </div>
    </div>

    <UForm
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
          autofocus
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

      <UButton
        type="submit"
        label="Connect"
        block
        :loading="loading"
      />
    </UForm>

    <div class="flex items-center justify-center gap-1.5 text-xs text-muted">
      <UIcon
        name="i-lucide-lock"
        class="size-3.5 shrink-0"
      />
      Stored only in this browser — sent straight to DigitalOcean.
    </div>

    <USeparator />

    <p class="text-xs text-muted text-center text-balance">
      Need a token? Create one in the DigitalOcean control panel under
      <span class="text-default font-medium">API → Tokens</span>.
    </p>
  </div>
</template>
