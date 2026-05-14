import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '@tanstack/react-form'
import { t } from '@lingui/core/macro'
import { useBrandSession } from '#/features/identity/session/BrandSessionContext'
import { useAppForm } from '#/shared/ui/form'
import { WizardSectionTitle } from '#/shared/ui/wizard'
import { useBriefBuilderStore } from '../store'
import { createFormInputSchema, createWebsiteUrlFieldSchema } from '../schemas'
import { useRegisterStepValidator } from '../validation'
import { PDFUploadField } from '../components/PDFUploadField'
import {
  useInitBriefBuilder,
  getInitErrorMessage,
} from '../hooks/useInitBriefBuilder'

export function P1Input() {
  const store = useBriefBuilderStore()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { brandWorkspace } = useBrandSession()

  const initMutation = useInitBriefBuilder()
  const formInputSchema = createFormInputSchema()
  const websiteUrlFieldSchema = createWebsiteUrlFieldSchema()

  const form = useAppForm({
    defaultValues: {
      websiteUrl: store.formInput.websiteUrl,
      descriptionText: store.formInput.descriptionText,
      pdfFile: store.pdfFile,
    },
    validators: {
      onSubmit: formInputSchema,
    },
    onSubmit: () => {},
  })

  const values = useStore(form.store, (s) => s.values)
  const prevRef = useRef(values)

  useEffect(() => {
    if (prevRef.current === values) return
    prevRef.current = values
    useBriefBuilderStore.setState((prev) => ({
      formInput: {
        ...prev.formInput,
        websiteUrl: values.websiteUrl,
        descriptionText: values.descriptionText,
      },
    }))
  }, [values])

  const handlePdfChange = useCallback(
    (file: File | null) => {
      form.setFieldValue('pdfFile', file)
      useBriefBuilderStore.getState().setPdfFile(file)
      setSubmitError(null)
    },
    [form],
  )

  useRegisterStepValidator(
    useCallback(async () => {
      setSubmitError(null)

      await form.handleSubmit()
      if (!form.state.isValid) return false

      const { websiteUrl, descriptionText } = form.state.values
      const pdfFile = useBriefBuilderStore.getState().pdfFile

      try {
        const result = await initMutation.mutateAsync({
          brandWorkspaceId: brandWorkspace.id,
          websiteUrl,
          descriptionText,
          pdfFile,
        })

        useBriefBuilderStore
          .getState()
          .setField('processingToken', result.processing_token)

        return true
      } catch (error) {
        const { message } = getInitErrorMessage(error)
        setSubmitError(message)
        return false
      }
    }, [form, initMutation, brandWorkspace.id]),
  )

  const hasInput =
    values.websiteUrl.trim().length > 0 ||
    values.descriptionText.trim().length > 0 ||
    values.pdfFile !== null

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <WizardSectionTitle
        title={t`Contanos sobre tu producto`}
        subtitle={t`Ingresá la web del producto, describí qué hace o subí un PDF para generar el brief.`}
      />
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <form.AppField
          name="websiteUrl"
          validators={{ onBlur: websiteUrlFieldSchema }}
          listeners={{
            onBlur: ({ value, fieldApi }) => {
              const trimmed = value.trim()
              if (!trimmed) return
              if (/^https?:\/\//i.test(trimmed)) return
              fieldApi.setValue(`https://${trimmed}`)
              void fieldApi.validate('blur')
            },
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <field.TextField
                label={t`Sitio web del producto`}
                placeholder="https://miproducto.com"
                maxLength={500}
              />
              {brandWorkspace.website_url && (
                <button
                  type="button"
                  className="self-start text-[length:var(--font-size-xs)] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => {
                    form.setFieldValue(
                      'websiteUrl',
                      brandWorkspace.website_url ?? '',
                    )
                  }}
                >
                  {t`Usar el de la marca`}
                </button>
              )}
            </div>
          )}
        </form.AppField>
        <form.AppField name="descriptionText">
          {(field) => (
            <field.TextareaField
              label={t`Descripción del producto o servicio`}
              hint={t`Opcional si subís un PDF.`}
              placeholder={t`Describí brevemente qué hace tu marca, a quién le vende y qué tipo de campaña necesitás.`}
              maxLength={2000}
              rows={4}
            />
          )}
        </form.AppField>
        <PDFUploadField file={values.pdfFile} onFileChange={handlePdfChange} />
      </div>
      {submitError && (
        <p
          role="alert"
          className="text-[length:var(--font-size-xs)] text-destructive"
        >
          {submitError}
        </p>
      )}
      {!hasInput && (
        <p className="text-[length:var(--font-size-xs)] text-muted-foreground">
          {t`Completa al menos uno de los campos para continuar.`}
        </p>
      )}
    </div>
  )
}
