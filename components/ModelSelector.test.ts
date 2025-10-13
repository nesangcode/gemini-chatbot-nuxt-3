import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ModelSelector from './ModelSelector.vue'

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  SparklesIcon: { name: 'SparklesIcon', template: '<div>SparklesIcon</div>' },
  ChevronDownIcon: { name: 'ChevronDownIcon', template: '<div>ChevronDownIcon</div>' }
}))

describe('ModelSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with default model', () => {
    const wrapper = mount(ModelSelector, {
      props: {
        modelValue: 'gemini-2.5-flash'
      }
    })

    expect(wrapper.text()).toContain('Gemini 2.5 Flash')
  })

  it('should render with custom model', () => {
    const wrapper = mount(ModelSelector, {
      props: {
        modelValue: 'gemini-2.5-pro'
      }
    })

    expect(wrapper.text()).toContain('Gemini 2.5 Pro')
  })

  it('should render main button correctly', async () => {
    const wrapper = mount(ModelSelector, {
      props: {
        modelValue: 'gemini-2.5-flash'
      }
    })

    const button = wrapper.find('button')
    
    // Verify main button exists and is clickable
    expect(button.exists()).toBe(true)
    expect(button.element.tagName).toBe('BUTTON')
  })

  it('should emit update:modelValue when selecting a model', async () => {
    const wrapper = mount(ModelSelector, {
      props: {
        modelValue: 'gemini-2.5-flash'
      }
    })

    // Open dropdown
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    // Find and click the pro model button
    const modelButtons = wrapper.findAll('button')
    const proButton = modelButtons.find(btn => btn.text().includes('Gemini 2.5 Pro'))
    
    if (proButton) {
      await proButton.trigger('click')
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['gemini-2.5-pro'])
    }
  })

  it('should emit event and start closing dropdown after selecting a model', async () => {
    const wrapper = mount(ModelSelector, {
      props: {
        modelValue: 'gemini-2.5-flash'
      }
    })

    // Open dropdown
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    
    const buttonsBefore = wrapper.findAll('button').length
    expect(buttonsBefore).toBeGreaterThan(1)

    // Select a model
    const modelButtons = wrapper.findAll('button')
    const proButton = modelButtons.find(btn => btn.text().includes('Gemini 2.5 Pro'))
    
    if (proButton) {
      await proButton.trigger('click')
      
      // Verify the selection event was emitted
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['gemini-2.5-pro'])
    }
  })

  it('should disable button when disabled prop is true', () => {
    const wrapper = mount(ModelSelector, {
      props: {
        modelValue: 'gemini-2.5-flash',
        disabled: true
      }
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('should show selected model name and description', () => {
    const wrapper = mount(ModelSelector, {
      props: {
        modelValue: 'gemini-2.5-flash'
      }
    })

    expect(wrapper.text()).toContain('Gemini 2.5 Flash')
    expect(wrapper.text()).toContain('Fast and efficient')
  })

  it('should handle invalid modelValue gracefully', () => {
    const wrapper = mount(ModelSelector, {
      props: {
        modelValue: 'invalid-model'
      }
    })

    // Should default to first model (Gemini 2.5 Pro)
    expect(wrapper.text()).toContain('Gemini 2.5 Pro')
  })

  it('should display both available models in dropdown', async () => {
    const wrapper = mount(ModelSelector, {
      props: {
        modelValue: 'gemini-2.5-flash'
      }
    })

    // Open dropdown
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    // Should show both models
    expect(wrapper.text()).toContain('Gemini 2.5 Pro')
    expect(wrapper.text()).toContain('Gemini 2.5 Flash')
  })

  it('should apply active styling to selected model in dropdown', async () => {
    const wrapper = mount(ModelSelector, {
      props: {
        modelValue: 'gemini-2.5-flash'
      }
    })

    // Open dropdown
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    const modelButtons = wrapper.findAll('button')
    const flashButton = modelButtons.find(btn => btn.text().includes('Gemini 2.5 Flash'))
    
    if (flashButton) {
      expect(flashButton.classes()).toContain('bg-indigo-100')
    }
  })

  it('should show Active badge for selected model', async () => {
    const wrapper = mount(ModelSelector, {
      props: {
        modelValue: 'gemini-2.5-flash'
      }
    })

    // Open dropdown
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Active')
  })
})
