// Shopify Storefront API - Fetch products with pagination, search and collection filter
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
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
                quantityAvailable
              }
            }
          }
          collections(first: 5) {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
        }
      }
    }
  }
`;

const COLLECTION_PRODUCTS_QUERY = `
  query GetCollectionProducts($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      id
      title
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
          startCursor
        }
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
                  quantityAvailable
                }
              }
            }
          }
        }
      }
    }
  }
`;

function transformProduct(node) {
  const firstImage = node.images.edges[0]?.node;
  const variants = node.variants.edges.map(({ node: v }) => ({
    id: v.id.replace("gid://shopify/ProductVariant/", ""),
    title: v.title,
    price: v.price.amount,
    available: v.availableForSale,
    quantity: v.quantityAvailable,
  }));
  
  // Get first available variant
  const availableVariant = variants.find(v => v.available && v.quantity > 0) || variants[0];
  
  // Check if product has any available inventory
  const hasInventory = variants.some(v => v.available && v.quantity > 0);

  const productId = node.id.replace("gid://shopify/Product/", "");

  return {
    id: productId,
    variant_id: availableVariant?.id || "",
    title: node.title,
    handle: node.handle,
    description: node.description,
    price: node.priceRange.minVariantPrice.amount,
    currency: node.priceRange.minVariantPrice.currencyCode,
    image: firstImage?.url || null,
    imageAlt: firstImage?.altText || node.title,
    available: hasInventory,
    variants,
    collections: node.collections?.edges.map(({ node: c }) => ({
      id: c.id.replace("gid://shopify/Collection/", ""),
      title: c.title,
      handle: c.handle,
    })) || [],
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
    console.error("Missing Shopify Storefront credentials");
    return res.status(500).json({ message: "Shopify not configured" });
  }

  const { search, collection, cursor, limit = "100" } = req.query;
  const first = Math.min(parseInt(limit) || 100, 250); // Max 250 per Shopify limits

  try {
    let query, variables;

    if (collection) {
      // Fetch products from a specific collection
      query = COLLECTION_PRODUCTS_QUERY;
      variables = { handle: collection, first, after: cursor || null };
    } else {
      // Fetch all products with optional search
      query = PRODUCTS_QUERY;
      let searchQuery = "available_for_sale:true";
      if (search) {
        searchQuery = `title:*${search}* AND available_for_sale:true`;
      }
      variables = { first, after: cursor || null, query: searchQuery };
    }

    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
      }
    );

    const data = await response.json();

    if (data.errors) {
      console.error("Shopify API errors:", data.errors);
      return res.status(500).json({ message: "Shopify API error", errors: data.errors });
    }

    // Extract products based on query type
    const productsData = collection 
      ? data.data.collection?.products 
      : data.data.products;

    if (!productsData) {
      return res.status(200).json({ 
        products: [], 
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        total: 0 
      });
    }

    // Transform and filter products (exclude those with 0 inventory)
    const products = productsData.edges
      .map(({ node }) => transformProduct(node))
      .filter(p => p.available);

    return res.status(200).json({
      products,
      pageInfo: productsData.pageInfo,
      collectionTitle: collection ? data.data.collection?.title : null,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
}
