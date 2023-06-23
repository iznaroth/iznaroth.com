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

export const QUERY_POSTLIST = gql`
{
    simplePosts(){
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
        }
    }
}`