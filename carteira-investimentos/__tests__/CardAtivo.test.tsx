/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import CardAtivo from "../components/CardAtivo";

describe("Componente CardAtivo", () => {
  it("deve renderizar o símbolo, nome da empresa e valores formatados em R$", () => {
    // Preparar (Arrange)
    const ativoMock = {
      symbol: "PETR4",
      longName: "Petróleo Brasileiro S.A. - Petrobras",
      regularMarketPrice: 38.5,
      regularMarketChange: 1.25,
      regularMarketChangePercent: 3.36,
      regularMarketVolume: 45200000,
      currency: "BRL",
    };

    // Agir (Act)
    render(<CardAtivo ativo={ativoMock} />);

    // Conferir (Assert)
    expect(screen.getByText("PETR4")).toBeInTheDocument();
    expect(
      screen.getByText("Petróleo Brasileiro S.A. - Petrobras"),
    ).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?38,50/)).toBeInTheDocument();
    expect(screen.getByText(/\+R\$\s?1,25\s?\(\+3\.36%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Vol:\s?45\.200\.000/)).toBeInTheDocument();
  });

  it("deve exibir R$ 0,00 e destaque vermelho quando a variação for negativa e o preço vier indefinido", () => {
    const ativoNegativoMock = {
      symbol: "VALE3",
      shortName: "VALE ON",
      regularMarketChange: -2.1,
      regularMarketChangePercent: -3.45,
    };

    render(<CardAtivo ativo={ativoNegativoMock} />);

    expect(screen.getByText("VALE3")).toBeInTheDocument();
    expect(screen.getByText("VALE ON")).toBeInTheDocument();
    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
    expect(screen.getByText(/-R\$\s?2,10\s?\(-3\.45%\)/)).toBeInTheDocument();
  });
});
