import React from 'react';
import { Pagination as BootstrapPagination } from 'react-bootstrap';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (currentPage > 1) {
        items.push(
            <BootstrapPagination.First key="first" onClick={() => onPageChange(1)} />,
            <BootstrapPagination.Prev key="prev" onClick={() => onPageChange(currentPage - 1)} />
        );
    }

    for (let page = startPage; page <= endPage; page++) {
        items.push(
            <BootstrapPagination.Item
                key={page}
                active={page === currentPage}
                onClick={() => onPageChange(page)}
            >
                {page}
            </BootstrapPagination.Item>
        );
    }

    if (currentPage < totalPages) {
        items.push(
            <BootstrapPagination.Next key="next" onClick={() => onPageChange(currentPage + 1)} />,
            <BootstrapPagination.Last key="last" onClick={() => onPageChange(totalPages)} />
        );
    }

    return (
        <div className="d-flex justify-content-center mt-4">
            <BootstrapPagination>{items}</BootstrapPagination>
        </div>
    );
};

export default Pagination;
