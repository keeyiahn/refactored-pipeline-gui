import { useState } from 'react';

export default function useTemplates() {
    const initialTemplates = {
        "generator-source": {
            id: "generator-source",
            type: "input",
            data: { label: "generator-source" },
        },
        "cat-udf": {
            id: "cat-udf",
            type: "default",
            data: { label: "cat-udf" },
        },
        "log-sink": {
            id: "log-sink",
            type: "output",
            data: { label: "log-sink" },
        },
    }

    const [templates, setTemplates] = useState(initialTemplates);


    const addTemplate = (template) => {
        setTemplates((prevTemplates) => ({
            ...prevTemplates,
            [template.id]: template
        }));
    }

    return {
        templates,
        addTemplate
    };
}