<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { FetchError } from 'ofetch'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Connect' })

const auth = useDoAuthStore()
const api = useDoApi()
const toast = useToast()

const schema = z.object({
  token: z.string().min(1, 'Paste your DigitalOcean API token')
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ token: '' })
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  // Set the token first so $doFetch can use it to validate against the API.
  auth.connect(event.data.token)
  try {
    await api.account.get() // validates the token via GET /v2/account
    toast.add({
      title: 'Connected',
      description: 'Your DigitalOcean account is linked.',
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
    await navigateTo('/')
  } catch (err) {
    auth.disconnect() // bad token — don't keep it
    // Errors come straight from the DigitalOcean API: { id, message, request_id }.
    const message = err instanceof FetchError
      ? (err.data?.message ?? err.statusMessage ?? 'Could not verify token')
      : 'Could not verify token'
    toast.add({
      title: 'Connection failed',
      description: message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-2">
      <UIcon
        name="i-simple-icons-digitalocean"
        class="size-10 text-primary mx-auto"
      />
      <h1 class="text-xl font-semibold text-highlighted">
        Connect to DigitalOcean
      </h1>
      <p class="text-sm text-muted">
        Paste a Personal Access Token to manage your resources. It is stored only in this browser.
      </p>
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
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        label="Connect"
        block
        :loading="loading"
      />

      <p class="text-xs text-muted text-center">
        Need a token? Create one in the DigitalOcean control panel under API → Tokens.
      </p>
    </UForm>
  </div>
</template>
