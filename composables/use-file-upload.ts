export function useFileUpload() {
  const selectedImages = ref<any[]>([])
  const selectedPdfs = ref<any[]>([])
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const pdfInputRef = ref<HTMLInputElement | null>(null)
  const isUploadingImages = ref(false)
  const isUploadingPdfs = ref(false)

  function triggerImageUpload() {
    fileInputRef.value?.click()
  }

  function triggerPdfUpload() {
    pdfInputRef.value?.click()
  }

  async function handleImageSelect(event: Event) {
    const input = event.target as HTMLInputElement
    const files = input.files
    
    if (!files || files.length === 0) return

    isUploadingImages.value = true

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        
        const reader = new FileReader()
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const dataUrl = await base64Promise as string
        const base64 = dataUrl.split(',')[1]

        selectedImages.value.push({
          data: base64,
          mimeType: file.type,
          name: file.name,
          preview: dataUrl
        })
      }
    } catch (error) {
      console.error('Error reading images:', error)
    } finally {
      isUploadingImages.value = false
      if (input) input.value = ''
    }
  }

  async function handlePdfSelect(event: Event) {
    const input = event.target as HTMLInputElement
    const files = input.files
    
    if (!files || files.length === 0) return

    isUploadingPdfs.value = true

    try {
      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf') continue
        
        const reader = new FileReader()
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const dataUrl = await base64Promise as string
        const base64 = dataUrl.split(',')[1]

        selectedPdfs.value.push({
          data: base64,
          mimeType: file.type,
          name: file.name,
          size: file.size
        })
      }
    } catch (error) {
      console.error('Error reading PDFs:', error)
    } finally {
      isUploadingPdfs.value = false
      if (input) input.value = ''
    }
  }

  function removeImage(index: number) {
    selectedImages.value.splice(index, 1)
  }

  function removePdf(index: number) {
    selectedPdfs.value.splice(index, 1)
  }

  function clearAllFiles() {
    selectedImages.value = []
    selectedPdfs.value = []
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return {
    selectedImages,
    selectedPdfs,
    fileInputRef,
    pdfInputRef,
    isUploadingImages,
    isUploadingPdfs,
    triggerImageUpload,
    triggerPdfUpload,
    handleImageSelect,
    handlePdfSelect,
    removeImage,
    removePdf,
    clearAllFiles,
    formatFileSize
  }
}
