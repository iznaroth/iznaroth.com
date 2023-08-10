import { GraphQLClient, gql } from "graphql-request";

//You need to require(dotenv) here, but I don't understand polyfills yet and I'm tired. 
export const graphcms = new GraphQLClient('https://api-us-east-1-shared-usea1-02.hygraph.com/v2/clj81m6ee0yiw01ue66p15s02/master')

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
          html
        },
        headerImage {
          url
        },
        createdBy {
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
        createdBy {
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