import fs from 'fs';
import path from 'path';

const transformToDiscovery = (openapiSpec: any) => {
    const discoveryDocument: { tools: any[], resources: any[] } = {
        tools: [],
        resources: [],
    };

    // The x-anthropic-tools are already in the correct format
    if (openapiSpec['x-anthropic-tools']) {
        discoveryDocument.tools = openapiSpec['x-anthropic-tools'];
    }

    for (const pathKey in openapiSpec.paths) {
        const pathItem = openapiSpec.paths[pathKey];
        for (const method in pathItem) {
            const operation = pathItem[method];
            
            // Exclude the MCP endpoint itself from the list of resources
            if (pathKey === '/api/mcp') {
                continue;
            }

            const resource: { name: string; description: string; input_schema?: any } = {
                name: operation.operationId,
                description: operation.summary,
            };

            const requestBody = operation.requestBody;
            if (requestBody?.content?.['application/json']?.schema) {
                resource.input_schema = requestBody.content['application/json'].schema;
            }

            discoveryDocument.resources.push(resource);
        }
    }
    return discoveryDocument;
};

export const loadDiscoveryDocument = () => {
    const openapiPath = path.join(process.cwd(), 'public', 'openapi.json');
    const openapiSpec = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
    return transformToDiscovery(openapiSpec);
};
