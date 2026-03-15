<template>
  <div class="login-container">
    <div class="title-wrapper">
      <HKTitle img_path="/src/assets/imgs/TheGamemaster.png" :size="1" />
    </div>

    <div class="login-card" :class="{ 'error-shake': errorShake }">
      <!-- Email Step -->
      <div v-if="!authStore.otpSent" class="login-step">
        <p class="step-description">Enter your email to receive a one-time password</p>

        <div class="input-group">
          <label for="email" class="input-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="input-field"
            placeholder="Enter email"
            :disabled="authStore.loading"
            @keyup.enter="handleSendOtp"
          />
        </div>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <button
          class="submit-button"
          :disabled="!isEmailValid || authStore.loading"
          @click="handleSendOtp"
        >
          <span v-if="authStore.loading" class="button-spinner"></span>
          <span v-else>Send OTP</span>
        </button>
      </div>

      <!-- OTP Step -->
      <div v-else class="login-step">
        <p class="step-description">
          Enter the 6-digit code sent to <strong>{{ email }}</strong>
        </p>

        <div class="otp-container">
          <input
            v-for="(digit, index) in otpDigits"
            :key="index"
            :ref="(el) => setOtpInputRef(el as HTMLInputElement | null, index)"
            v-model="otpDigits[index]"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="1"
            class="otp-input"
            :disabled="authStore.loading"
            @input="handleOtpInput(index, $event)"
            @keydown="handleOtpKeydown(index, $event)"
            @paste="handleOtpPaste"
          />
        </div>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <button
          class="submit-button"
          :disabled="!isOtpComplete || authStore.loading"
          @click="handleVerifyOtp"
        >
          <span v-if="authStore.loading" class="button-spinner"></span>
          <span v-else>Verify</span>
        </button>

        <button class="back-button" :disabled="authStore.loading" @click="handleBackToEmail">
          Back to email
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HKTitle from '@/components/common/HKTitle.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const otpInputRefs = ref<Map<number, HTMLInputElement>>(new Map())

function setOtpInputRef(el: HTMLInputElement | null, index: number) {
  if (el) {
    otpInputRefs.value.set(index, el)
  }
}
const errorShake = ref(false)

const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value)
})

const isOtpComplete = computed(() => {
  return otpDigits.value.every((digit) => digit.length === 1)
})

const otpValue = computed(() => {
  return otpDigits.value.join('')
})

onMounted(() => {
  // If already authenticated, redirect to home
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      router.push('/')
    }
  },
)

async function handleSendOtp() {
  if (!isEmailValid.value) return

  const success = await authStore.sendOtp(email.value)
  if (!success) {
    triggerErrorShake()
  }
}

async function handleVerifyOtp() {
  if (!isOtpComplete.value) return

  const success = await authStore.verifyOtp(otpValue.value)
  if (!success) {
    triggerErrorShake()
    // Clear OTP fields on error
    otpDigits.value = ['', '', '', '', '', '']
    // Focus first input
    setTimeout(() => {
      otpInputRefs.value.get(0)?.focus()
    }, 100)
  }
}

function handleOtpInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value

  // Only allow single digit
  if (value.length > 1) {
    otpDigits.value[index] = value.slice(-1)
  } else {
    otpDigits.value[index] = value
  }

  // Auto-focus next input
  if (otpDigits.value[index] && index < 5) {
    otpInputRefs.value.get(index + 1)?.focus()
  }
}

function handleOtpKeydown(index: number, event: KeyboardEvent) {
  // Handle backspace
  if (event.key === 'Backspace') {
    if (!otpDigits.value[index] && index > 0) {
      // If current is empty, go to previous and clear it
      otpDigits.value[index - 1] = ''
      otpInputRefs.value.get(index - 1)?.focus()
    } else {
      // Clear current
      otpDigits.value[index] = ''
    }
  }

  // Handle left arrow
  if (event.key === 'ArrowLeft' && index > 0) {
    otpInputRefs.value.get(index - 1)?.focus()
  }

  // Handle right arrow
  if (event.key === 'ArrowRight' && index < 5) {
    otpInputRefs.value.get(index + 1)?.focus()
  }
}

function handleOtpPaste(event: ClipboardEvent) {
  event.preventDefault()
  const pasteData = event.clipboardData?.getData('text') || ''
  const digits = pasteData.replace(/\D/g, '').slice(0, 6).split('')

  digits.forEach((digit, i) => {
    if (i < 6) {
      otpDigits.value[i] = digit
    }
  })

  // Focus the appropriate input
  const focusIndex = Math.min(digits.length, 5)
  otpInputRefs.value.get(focusIndex)?.focus()
}

function triggerErrorShake() {
  errorShake.value = true
  setTimeout(() => {
    errorShake.value = false
  }, 500)
}

function handleBackToEmail() {
  authStore.resetOtpFlow()
  email.value = ''
  otpDigits.value = ['', '', '', '', '', '']
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-color: #f2f2ee;
  padding: 2rem 1rem;
}

.login-card {
  background-color: #eeede8;
  border-radius: 16px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid #cfcfcf;
}

.title-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.title-wrapper :deep(img) {
  max-width: 100%;
  height: auto;
}

.step-description {
  text-align: center;
  color: #424242;
  font-family: Perpetua, Avenir, Helvetica, Arial, sans-serif;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.step-description strong {
  color: #32a287;
  font-weight: 600;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  font-family: Perpetua, Avenir, Helvetica, Arial, sans-serif;
  font-size: 0.85rem;
  color: #424242;
  margin-bottom: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-field {
  width: 100%;
  padding: 0.875rem 1rem;
  font-family: Perpetua, Avenir, Helvetica, Arial, sans-serif;
  font-size: 1rem;
  color: #424242;
  background-color: #ffffff;
  border: 1px solid #cfcfcf;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: #32a287;
  box-shadow: 0 0 0 3px rgba(50, 162, 135, 0.15);
}

.input-field:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.input-field::placeholder {
  color: #929292;
}

.otp-container {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
}

.otp-input {
  width: 48px;
  height: 56px;
  text-align: center;
  font-family: Perpetua, Avenir, Helvetica, Arial, sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #424242;
  background-color: #ffffff;
  border: 1px solid #cfcfcf;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.otp-input:focus {
  outline: none;
  border-color: #32a287;
  box-shadow: 0 0 0 3px rgba(50, 162, 135, 0.15);
  transform: scale(1.05);
}

.otp-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  background-color: rgba(220, 20, 60, 0.1);
  color: #dc143c;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-family: Perpetua, Avenir, Helvetica, Arial, sans-serif;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
  border: 1px solid rgba(220, 20, 60, 0.2);
}

.submit-button {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-family: 'Trajan', 'Times New Roman', serif;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffffff;
  background-color: #32a287;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.submit-button:hover:not(:disabled) {
  background-color: #4bab91;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(50, 162, 135, 0.3);
}

.submit-button:active:not(:disabled) {
  background-color: #2d826d;
  transform: translateY(0);
}

.submit-button:disabled {
  background-color: #b8b8b8;
  cursor: not-allowed;
  opacity: 0.7;
}

.back-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  margin-top: 0.75rem;
  font-family: Perpetua, Avenir, Helvetica, Arial, sans-serif;
  font-size: 0.9rem;
  color: #929292;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.back-button:hover:not(:disabled) {
  color: #424242;
}

.back-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

.error-shake {
  animation: shake 0.5s ease-in-out;
}

/* Responsive adjustments - following HKTitle breakpoints */

/* Tablet (iPad Mini and smaller - 768px) */
@media (max-width: 768px) {
  .login-container {
    padding: 1.5rem 1rem;
  }

  .title-wrapper {
    padding: 1.5rem 0;
    margin-bottom: 1.5rem;
  }
}

/* Large phones (iPhone Plus/Max - 430px) */
@media (max-width: 430px) {
  .login-container {
    padding: 1rem;
  }

  .title-wrapper {
    padding: 1rem 0;
    margin-bottom: 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
  }

  .otp-container {
    gap: 0.5rem;
    padding: 0 0.5rem;
  }

  .otp-input {
    width: 44px;
    height: 52px;
    font-size: 1.35rem;
  }
}

/* Standard phones (iPhone 16 Pro, 15, 14 - 393px) */
@media (max-width: 395px) {
  .title-wrapper {
    padding: 0.75rem 0;
    margin-bottom: 0.75rem;
  }

  .otp-container {
    gap: 0.4rem;
    padding: 0 0.25rem;
  }

  .otp-input {
    width: 42px;
    height: 50px;
    font-size: 1.25rem;
  }
}

/* Small phones (iPhone SE - 375px) */
@media (max-width: 375px) {
  .title-wrapper {
    padding: 0.5rem 0;
    margin-bottom: 0.5rem;
  }

  .otp-container {
    gap: 0.35rem;
    padding: 0 0.25rem;
  }

  .otp-input {
    width: 40px;
    height: 48px;
    font-size: 1.2rem;
  }
}
</style>
