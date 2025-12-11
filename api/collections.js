// Shopify Storefront API - Fetch collections (categories)
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

const COLLECTIONS_QUERY = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          image {
            url
            altText
          }
          productsCount {
            count
          }
        }
      }
    }
  }
`;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
    console.error("Missing Shopify Storefront credentials");
    return res.status(500).json({ message: "Shopify not configured" });
  }

  try {
    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: COLLECTIONS_QUERY,
          variables: { first: 50 },
        }),
      }
    );

    const data = await response.json();

    if (data.errors) {
      console.error("Shopify API errors:", data.errors);
      return res.status(500).json({ message: "Shopify API error", errors: data.errors });
    }

    // Transform collections
    const collections = data.data.collections.edges.map(({ node }) => ({
      id: node.id.replace("gid://shopify/Collection/", ""),
      title: node.title,
      handle: node.handle,
      description: node.description,
      image: node.image?.url || null,
      productsCount: node.productsCount?.count || 0,
    }));

    return res.status(200).json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return res.status(500).json({ message: "Failed to fetch collections" });
  }
}

