import type { FlattenedField, Payload, Where } from 'payload'

import { QueryError } from 'payload'

import { parseParams } from './parseParams.js'

type GetBuildQueryPluginArgs = {
  collectionSlug?: string
  versionsFields?: FlattenedField[]
}

export type BuildQueryArgs = {
  globalSlug?: string
  locale?: string
  payload: Payload
  where: Where
}

// This plugin asynchronously builds a list of Mongoose query constraints
// which can then be used in subsequent Mongoose queries.
// Deprecated in favor of using simpler buildQuery directly
export const getBuildQueryPlugin = ({
  collectionSlug,
  versionsFields,
}: GetBuildQueryPluginArgs = {}) => {
  return function buildQueryPlugin(schema) {
    const modifiedSchema = schema
    async function schemaBuildQuery({
      globalSlug,
      locale,
      payload,
      where,
    }: BuildQueryArgs): Promise<Record<string, unknown>> {
      let fields = versionsFields
      if (!fields) {
        if (globalSlug) {
          const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug)
          fields = globalConfig.flattenedFields
        }
        if (collectionSlug) {
          const collectionConfig = payload.collections[collectionSlug].config
          fields = collectionConfig.flattenedFields
        }
      }

      const errors = []
      const result = await parseParams({
        collectionSlug,
        fields,
        globalSlug,
        locale,
        parentIsLocalized: false,
        payload,
        where,
      })

      if (errors.length > 0) {
        throw new QueryError(errors)
      }

      return result
    }
    modifiedSchema.statics.buildQuery = schemaBuildQuery
  }
}
