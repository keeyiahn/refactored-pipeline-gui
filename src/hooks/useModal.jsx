import { useState } from 'react';

export default function useModal() {
    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    // Open modal with specific content
    const openModal = (content) => {
        setModalContent(content);
        setIsOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsOpen(false);
        setModalContent(null);
    };

    return {
        isOpen,
        modalContent,
        openModal,
        closeModal
    };
}