import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import Signup from './Signup';

describe('Signup — documentos jurídicos', () => {
    test('só habilita a continuidade após aceite e ciência separados', () => {
        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByLabelText(/Pais \/ Responsável/i));
        fireEvent.click(screen.getByRole('button', { name: /^Continuar$/i }));

        const continueButton = screen.getByRole('button', { name: /Continuar para planos/i });
        const termsCheckbox = screen.getByRole('checkbox', { name: /Li e aceito os Termos de Uso/i });
        const privacyCheckbox = screen.getByRole('checkbox', { name: /Declaro ciência da Política de Privacidade/i });

        expect(continueButton).toBeDisabled();
        expect(termsCheckbox).not.toBeChecked();
        expect(privacyCheckbox).not.toBeChecked();

        fireEvent.click(termsCheckbox);
        expect(continueButton).toBeDisabled();

        fireEvent.click(privacyCheckbox);
        expect(continueButton).toBeEnabled();

        expect(screen.getByRole('link', { name: /Termos de Uso do AutisConnect/i })).toHaveAttribute(
            'href',
            '/legal/termos-de-uso-autisconnect-v1.0.pdf'
        );
        expect(screen.getByRole('link', { name: /Política de Privacidade e Proteção de Dados/i })).toHaveAttribute(
            'href',
            '/legal/politica-de-privacidade-autisconnect-v1.0.pdf'
        );
    });
});
