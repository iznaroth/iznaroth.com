import { GraphQLClient, gql } from "graphql-request";

export const graphcms = new GraphQLClient('https://us-east-1-shared-usea1-02.cdn.hygraph.com/content/clj81m6ee0yiw01ue66p15s02/master')

const simplePost = `
    id,
    title,
    slug,
    subtitle,
    headerImage { url },
    timestamp,
    content { html },
    relevantTags
`

const category = `
    id,
    name,
    slug,
    color { css }
`

export const QUERY_SLUG_CATEGORIES = gql`
{
    categories(){
        id,
        name,
        slug
    }
}`

//All blog-posts NOT INCLUDING DEVLOGS.
export const QUERY_POSTLIST = gql`
{
    simplePosts(orderBy: publishedAt_DESC, where: {relevantTags_contains_none: devlog}){
        id,
        timestamp,
        title,
        subtitle,
        slug,
        relevantTags,
        content {
          html,
          text
        },
        headerImage {
          url
        },
        publishedBy {
            picture
            name
        }
    }
}`

export const QUERY_DEVLOG = gql`
{
    simplePosts(orderBy: publishedAt_DESC, where: {relevantTags_contains_all: devlog}){
        id,
        timestamp,
        title,
        subtitle,
        slug,
        relevantTags,
        content {
          html
        },
        headerImage {
          url
        },
        publishedBy {
            picture
            name
        }
    }
}`

export const QUERY_MAPENTRY = gql`
{
    mapInfos (first:100) {
        entryID
        header
        environs
        populations
        headerColor {
          hex
        }
        body
      }
}`



export const QUERY_SETTLEMENTENTRY = gql`
{
    settlementInfos (first:100) {
        name
        nameColor {
            hex
          }
        subtitle
        content
      }
}`

export const QUERY_WORLDWELL = gql`
{
    worldwellEntries () {
      bannerImage {
        url
      }
      header
      htmlBody
      slug
    }
}`

export const QUERY_ENTITY_1 = gql`
{
    mapEntities(orderBy: publishedAt_DESC, where: {legacyIndicator_TEMP: false}, first: 100, skip:0){
        id,
        name,
    		nameColor{hex},
    		labelColor{hex},
    		mapSuperentity{name},
    		subtitle,
    		flagEmblem{url},
    		summaryProperties,
    		eyecatchFacts,
    		content,
    		demographicsCulture,
    		geography,
    		entityHistory,
    		economy,
    		governmentPolitics,
    		settlementsLandmarks,
    		foreignRelations
    }
}`

export const QUERY_ENTITY_2 = gql`
{
    mapEntities(orderBy: publishedAt_DESC, where: {legacyIndicator_TEMP: false}, first: 100, skip:100){
        id,
        name,
    		nameColor{hex},
    		labelColor{hex},
    		mapSuperentity{name},
    		subtitle,
    		flagEmblem{url},
    		summaryProperties,
    		eyecatchFacts,
    		content,
    		demographicsCulture,
    		geography,
    		entityHistory,
    		economy,
    		governmentPolitics,
    		settlementsLandmarks,
    		foreignRelations
    }
}`

