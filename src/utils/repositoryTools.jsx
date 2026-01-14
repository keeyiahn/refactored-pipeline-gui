import yaml from 'js-yaml';

/**
 * Generate Dockerfile for a UDF script
 */
export const generateDockerfile = (scriptName) => {
    const sanitizedName = scriptName.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `FROM python:3.10-slim

WORKDIR /app

COPY . /app

RUN pip install -r requirements.txt

CMD ["python", "-u","${sanitizedName}.py"]
`;
};

/**
 * Generate requirements.txt for Python UDF scripts
 */
export const generateRequirementsTxt = () => {
    return `pynumaflow>=1.0.0
`;
};

/**
 * Generate K8s Deployment manifest for a UDF script
 */
export const generateUdfDeployment = (scriptName, namespace = 'default') => {
    const sanitizedName = scriptName.replace(/[^a-zA-Z0-9-_]/g, '-');
    const imageName = `${sanitizedName}:latest`;
    
    return {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
            name: `${sanitizedName}-deployment`,
            namespace: namespace,
            labels: {
                app: sanitizedName,
                component: 'udf'
            }
        },
        spec: {
            replicas: 1,
            selector: {
                matchLabels: {
                    app: sanitizedName
                }
            },
            template: {
                metadata: {
                    labels: {
                        app: sanitizedName,
                        component: 'udf'
                    }
                },
                spec: {
                    containers: [
                        {
                            name: sanitizedName,
                            image: imageName,
                            imagePullPolicy: 'IfNotPresent',
                            ports: [
                                {
                                    containerPort: 50051,
                                    name: 'grpc'
                                }
                            ],
                            resources: {
                                requests: {
                                    memory: '128Mi',
                                    cpu: '100m'
                                },
                                limits: {
                                    memory: '512Mi',
                                    cpu: '500m'
                                }
                            }
                        }
                    ]
                }
            }
        }
    };
};

/**
 * Generate K8s Service manifest for a UDF script
 */
export const generateUdfService = (scriptName, namespace = 'default') => {
    const sanitizedName = scriptName.replace(/[^a-zA-Z0-9-_]/g, '-');
    
    return {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: `${sanitizedName}-service`,
            namespace: namespace,
            labels: {
                app: sanitizedName,
                component: 'udf'
            }
        },
        spec: {
            selector: {
                app: sanitizedName
            },
            ports: [
                {
                    port: 50051,
                    targetPort: 50051,
                    protocol: 'TCP',
                    name: 'grpc'
                }
            ],
            type: 'ClusterIP'
        }
    };
};

/**
 * Generate complete directory structure for export
 */
export const generateDirectoryStructure = (repository) => {
    if (!repository) return null;

    const structure = {
        'pipeline.yaml': repository.pipeline || '',
        'requirements.txt': generateRequirementsTxt(),
        scripts: {},
        dockerfiles: {},
        manifests: {}
    };

    // Track which scripts we've processed to avoid duplicates
    const processedScripts = new Set();
    
    // Add scripts and their corresponding dockerfiles
    Object.entries(repository.scripts || {}).forEach(([scriptName, scriptData]) => {
        const sanitizedName = scriptName.replace(/[^a-zA-Z0-9-_]/g, '_');
        // Handle both old format (just string) and new format (object with data property)
        const scriptContent = typeof scriptData === 'string' ? scriptData : (scriptData.data || scriptData);
        structure.scripts[`${sanitizedName}.py`] = scriptContent;
        structure.dockerfiles[`${sanitizedName}/Dockerfile`] = generateDockerfile(scriptName);
        processedScripts.add(scriptName);
    });

    // Add any additional dockerfiles from repository (only if not already generated from scripts)
    Object.entries(repository.dockerfiles || {}).forEach(([name, content]) => {
        // Skip if this is an auto-generated dockerfile for a script we already processed
        if (!processedScripts.has(name)) {
            structure.dockerfiles[name] = content;
        }
    });

    // Add any additional manifests from repository
    Object.entries(repository.manifests || {}).forEach(([name, content]) => {
        if (typeof content === 'object') {
            structure.manifests[name] = content;
        } else {
            structure.manifests[name] = content;
        }
    });

    return structure;
};

