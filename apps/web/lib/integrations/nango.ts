/**
 * Nango Integration Service
 * Handles OAuth connections for calendar and CRM integrations
 * 
 * To enable: npm install @nangohq/node
 */

// Dynamically import Nango to avoid build errors if not installed
let Nango: any = null
let nangoInstance: any = null

async function getNango() {
  if (nangoInstance) return nangoInstance
  
  if (!Nango) {
    try {
      // @ts-ignore - dynamic import for optional dependency
      const module = await import('@nangohq/node')
      Nango = module.Nango
    } catch {
      console.warn('Nango SDK not installed. Run: npm install @nangohq/node')
      return null
    }
  }
  
  nangoInstance = new Nango({ 
    secretKey: process.env.NANGO_SECRET_KEY || '' 
  })
  
  return nangoInstance
}

export { getNango }

/**
 * Create a Nango connect session token
 * This is used to open the OAuth popup securely
 */
export async function createConnectSession(params: {
  integrationId: string // e.g., 'google-calendar', 'microsoft-calendar'
  endUserId: string     // Unique ID for this user/business
}): Promise<{ token: string; url: string } | null> {
  const secretKey = process.env.NANGO_SECRET_KEY
  
  if (!secretKey) {
    console.error('NANGO_SECRET_KEY not configured')
    return null
  }
  
  try {
    const response = await fetch('https://api.nango.dev/connect/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        end_user: {
          id: params.endUserId,
        },
        allowed_integrations: [params.integrationId],
      }),
    })
    
    if (!response.ok) {
      console.error('Failed to create Nango session:', await response.text())
      return null
    }
    
    const data = await response.json()
    return {
      token: data.token,
      url: `https://connect.nango.dev/${data.token}`
    }
  } catch (error) {
    console.error('Error creating Nango session:', error)
    return null
  }
}

/**
 * List all connections for a user/business
 */
export async function listConnections(connectionId?: string) {
  const nango = await getNango()
  if (!nango) return []
  
  try {
    const connections = await nango.listConnections()
    if (connectionId) {
      return connections.connections.filter((c: any) => c.connection_id === connectionId)
    }
    return connections.connections
  } catch (error) {
    console.error('Error listing connections:', error)
    return []
  }
}

/**
 * Get a specific connection
 */
export async function getConnection(integrationId: string, connectionId: string) {
  const nango = await getNango()
  if (!nango) return null
  
  try {
    return await nango.getConnection(integrationId, connectionId)
  } catch (error) {
    console.error('Error getting connection:', error)
    return null
  }
}

/**
 * Delete a connection
 */
export async function deleteConnection(integrationId: string, connectionId: string) {
  const nango = await getNango()
  if (!nango) return false
  
  try {
    await nango.deleteConnection(integrationId, connectionId)
    return true
  } catch (error) {
    console.error('Error deleting connection:', error)
    return false
  }
}

/**
 * Make an authenticated API request through Nango proxy
 */
export async function proxyRequest(params: {
  integrationId: string
  connectionId: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  data?: Record<string, unknown>
}) {
  const nango = await getNango()
  if (!nango) throw new Error('Nango not configured')
  
  const { integrationId, connectionId, method, endpoint, data } = params
  
  try {
    const response = await nango.proxy({
      providerConfigKey: integrationId,
      connectionId,
      method,
      endpoint,
      data,
    })
    return response.data
  } catch (error) {
    console.error('Error making proxy request:', error)
    throw error
  }
}
