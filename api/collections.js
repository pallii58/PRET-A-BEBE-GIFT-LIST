// Shopify Storefront API - Fetch collections
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
        }
      }
    }
  }
`;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  console.log("[Collections] SHOPIFY_STORE_DOMAIN:", SHOPIFY_STORE_DOMAIN);
  console.log("[Collections] SHOPIFY_STOREFRONT_TOKEN:", SHOPIFY_STOREFRONT_TOKEN ? "SET" : "NOT SET");

  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
    console.error("[Collections] Missing Shopify Storefront credentials");
    return res.status(500).json({ message: "Shopify not configured" });
  }

  try {
    const url = `https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;
    console.log("[Collections] Fetching from:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: COLLECTIONS_QUERY,
        variables: { first: 50 },
      }),
    });

    const data = await response.json();
    console.log("[Collections] Response status:", response.status);
    console.log("[Collections] Response data:", JSON.stringify(data).substring(0, 500));

    if (data.errors) {
      console.error("[Collections] Shopify API errors:", data.errors);
      return res.status(500).json({ message: "Shopify API error", errors: data.errors });
    }

    if (!data.data?.collections?.edges) {
      console.error("[Collections] No collections in response");
      return res.status(200).json([]);
    }

    // Transform collections
    const collections = data.data.collections.edges.map(({ node }) => ({
      id: node.id.replace("gid://shopify/Collection/", ""),
      title: node.title,
      handle: node.handle,
      description: node.description,
      image: node.image?.url || null,
      productsCount: 0, // We'll skip counting for now
    }));

    console.log("[Collections] Found collections:", collections.length);
    return res.status(200).json(collections);
  } catch (error) {
    console.error("[Collections] Error:", error);
    return res.status(500).json({ message: "Failed to fetch collections", error: error.message });
  }
}
