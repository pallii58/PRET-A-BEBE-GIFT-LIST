// Shopify Storefront API - Fetch products
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
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
          query: PRODUCTS_QUERY,
          variables: { first: 50 },
        }),
      }
    );

    const data = await response.json();

    if (data.errors) {
      console.error("Shopify API errors:", data.errors);
      return res.status(500).json({ message: "Shopify API error", errors: data.errors });
    }

    // Transform products to a simpler format
    const products = data.data.products.edges.map(({ node }) => {
      const firstImage = node.images.edges[0]?.node;
      const firstVariant = node.variants.edges[0]?.node;
      
      // Extract numeric IDs from Shopify GIDs
      const productId = node.id.replace("gid://shopify/Product/", "");
      const variantId = firstVariant?.id.replace("gid://shopify/ProductVariant/", "") || "";

      return {
        id: productId,
        variant_id: variantId,
        title: node.title,
        handle: node.handle,
        description: node.description,
        price: node.priceRange.minVariantPrice.amount,
        currency: node.priceRange.minVariantPrice.currencyCode,
        image: firstImage?.url || null,
        imageAlt: firstImage?.altText || node.title,
        available: firstVariant?.availableForSale || false,
        variants: node.variants.edges.map(({ node: v }) => ({
          id: v.id.replace("gid://shopify/ProductVariant/", ""),
          title: v.title,
          price: v.price.amount,
          available: v.availableForSale,
        })),
      };
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
}

