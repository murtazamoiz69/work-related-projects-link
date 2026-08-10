export * from './types'
export {
  DEFAULT_TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_ICON,
  TEMPLATE_COVER_GRADIENTS,
  TEMPLATE_AUTHORS,
  TEMPLATE_VARIABLES,
  TEMPLATES,
  categoryIcon,
  extractTemplateVariables,
  renderTemplateWithSampleData,
  highlightTemplateVariables,
  stripHtmlToText,
  buildTemplate,
  buildBlankTemplate,
  bumpVersion,
  seedTemplates,
  saveTemplates,
  templateById,
  defaultPoll,
  newPollOption,
} from './data'
export { useTemplatesStore, recordTemplateUsage } from './store'
export { TemplatePickerModal } from './components/TemplatePickerModal'
export {
  TemplateCard,
  TemplateListRow,
  type TemplateAction,
} from './components/TemplateRosterViews'
