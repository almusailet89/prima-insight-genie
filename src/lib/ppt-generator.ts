import pptxgen from "pptxgenjs";

// Prima branding colors from their website
export const PRIMA_BRANDING = {
  primaryPurple: "7B2D94",
  accentTeal: "00B4A6", 
  lightGray: "F8F9FA",
  darkText: "2D3748",
  white: "FFFFFF",
  gradientPurple: ["7B2D94", "9F4BB8"], // Purple gradient
  secondaryGray: "718096"
};

export interface SlideData {
  type: 'title' | 'content' | 'table' | 'chart' | 'overview' | 'country' | 'variance' | 'forecast';
  title: string;
  subtitle?: string;
  content?: string;
  data?: any[];
  commentary?: string;
  country?: string;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  slides: SlideData[];
  metadata?: {
    generatedAt: string;
    author: string;
    department: string;
  };
}

export class PrimaPPTGenerator {
  private pptx: pptxgen;

  constructor() {
    this.pptx = new pptxgen();
    this.setupMasterSlides();
  }

  private setupMasterSlides() {
    // Set presentation properties
    this.pptx.author = "Prima Finance Team";
    this.pptx.company = "Prima Assicurazioni";
    this.pptx.subject = "Financial Report";
    this.pptx.title = "Prima Finance Report";

    // Define master slide with Prima branding
    this.pptx.defineSlideMaster({
      title: "PRIMA_MASTER",
      background: { color: PRIMA_BRANDING.white },
      objects: [
        // Header with Prima logo placeholder and gradient accent
        {
          rect: {
            x: 0, y: 0, w: "100%", h: 0.8,
            fill: { color: PRIMA_BRANDING.primaryPurple }
          }
        },
        // Footer with Prima branding
        {
          rect: {
            x: 0, y: 6.8, w: "100%", h: 0.5,
            fill: { color: PRIMA_BRANDING.lightGray }
          }
        },
        {
          text: {
            text: "Prima Assicurazioni - Finance Department",
            options: {
              x: 0.5, y: 7.0, w: 8, h: 0.3,
              fontSize: 10,
              color: PRIMA_BRANDING.secondaryGray,
              fontFace: "Segoe UI"
            }
          }
        },
        {
          text: {
            text: new Date().toLocaleDateString(),
            options: {
              x: 8.5, y: 7.0, w: 1.5, h: 0.3,
              fontSize: 10,
              color: PRIMA_BRANDING.secondaryGray,
              fontFace: "Segoe UI",
              align: "right"
            }
          }
        }
      ]
    });
  }

  generateReport(reportData: ReportData): pptxgen {
    // Generate each slide
    reportData.slides.forEach((slideData, index) => {
      switch (slideData.type) {
        case 'title':
          this.createTitleSlide(slideData);
          break;
        case 'overview':
          this.createOverviewSlide(slideData);
          break;
        case 'country':
          this.createCountrySlide(slideData);
          break;
        case 'variance':
          this.createVarianceSlide(slideData);
          break;
        case 'forecast':
          this.createForecastSlide(slideData);
          break;
        case 'table':
          this.createTableSlide(slideData);
          break;
        case 'content':
        default:
          this.createContentSlide(slideData);
          break;
      }
    });

    return this.pptx;
  }

  private createTitleSlide(data: SlideData) {
    const slide = this.pptx.addSlide({ masterName: "PRIMA_MASTER" });

    // Large Prima title with gradient background
    slide.addShape("rect", {
      x: 1, y: 2, w: 8, h: 3,
      fill: { color: PRIMA_BRANDING.primaryPurple },
      line: { width: 0 },
      rectRadius: 0.2
    });

    slide.addText(data.title, {
      x: 1.5, y: 2.5, w: 7, h: 1.5,
      fontSize: 36,
      color: PRIMA_BRANDING.white,
      fontFace: "Segoe UI",
      bold: true,
      align: "center",
      valign: "middle"
    });

    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 1.5, y: 4, w: 7, h: 0.8,
        fontSize: 18,
        color: PRIMA_BRANDING.white,
        fontFace: "Segoe UI",
        align: "center",
        valign: "middle"
      });
    }

    // Add Prima branding text
    slide.addText("Finance Department | Prima Assicurazioni", {
      x: 2, y: 5.5, w: 6, h: 0.5,
      fontSize: 14,
      color: PRIMA_BRANDING.primaryPurple,
      fontFace: "Segoe UI",
      align: "center"
    });
  }

  private createOverviewSlide(data: SlideData) {
    const slide = this.pptx.addSlide({ masterName: "PRIMA_MASTER" });

    // Title with Prima accent
    slide.addText(data.title, {
      x: 0.5, y: 1, w: 9, h: 0.8,
      fontSize: 28,
      color: PRIMA_BRANDING.primaryPurple,
      fontFace: "Segoe UI",
      bold: true
    });

    // KPI Table if data exists
    if (data.data && data.data.length > 0) {
      const tableData = [
        [
          { text: "KPI", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } },
          { text: "Current", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } },
          { text: "Previous", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } },
          { text: "Variance", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } }
        ],
        ...data.data.map((item: any) => [
          { text: item.name || item.kpi, options: { fontFace: "Segoe UI", fontSize: 11 } },
          { text: this.formatCurrency(item.current || item.value), options: { fontFace: "Segoe UI", fontSize: 11 } },
          { text: this.formatCurrency(item.previous || item.budget), options: { fontFace: "Segoe UI", fontSize: 11 } },
          { 
            text: this.formatPercentage(item.variance || item.percentVariance), 
            options: { 
              fontFace: "Segoe UI", 
              fontSize: 11,
              color: (item.variance || 0) >= 0 ? "00B050" : "C5504B"
            } 
          }
        ])
      ];

      slide.addTable(tableData, {
        x: 0.5, y: 2, w: 9, h: 3,
        colW: [2.5, 2, 2, 2.5],
        border: { pt: 1, color: PRIMA_BRANDING.lightGray },
        fill: { color: PRIMA_BRANDING.white }
      });
    }

    // AI Commentary
    if (data.commentary) {
      slide.addShape("rect", {
        x: 0.5, y: 5.2, w: 9, h: 1.5,
        fill: { color: PRIMA_BRANDING.lightGray },
        line: { width: 1, color: PRIMA_BRANDING.accentTeal },
        rectRadius: 0.1
      });

      slide.addText("AI Analysis", {
        x: 0.8, y: 5.4, w: 8.4, h: 0.3,
        fontSize: 12,
        color: PRIMA_BRANDING.primaryPurple,
        fontFace: "Segoe UI",
        bold: true
      });

      slide.addText(data.commentary, {
        x: 0.8, y: 5.7, w: 8.4, h: 1,
        fontSize: 10,
        color: PRIMA_BRANDING.darkText,
        fontFace: "Segoe UI",
        valign: "top"
      });
    }
  }

  private createCountrySlide(data: SlideData) {
    const slide = this.pptx.addSlide({ masterName: "PRIMA_MASTER" });

    // Country title with flag emoji
    const countryEmojis: { [key: string]: string } = {
      'Italy': '🇮🇹',
      'UK': '🇬🇧', 
      'Spain': '🇪🇸'
    };

    slide.addText(`${countryEmojis[data.country || ''] || ''} ${data.title}`, {
      x: 0.5, y: 1, w: 9, h: 0.8,
      fontSize: 24,
      color: PRIMA_BRANDING.primaryPurple,
      fontFace: "Segoe UI",
      bold: true
    });

    // Country performance table
    if (data.data && data.data.length > 0) {
      const tableData = [
        [
          { text: "Department", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } },
          { text: "Revenue (€000)", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } },
          { text: "Growth %", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } }
        ],
        ...data.data.map((item: any) => [
          { text: item.department || item.name, options: { fontFace: "Segoe UI", fontSize: 11 } },
          { text: this.formatCurrency(item.revenue || item.value), options: { fontFace: "Segoe UI", fontSize: 11 } },
          { 
            text: this.formatPercentage(item.growth || item.variance), 
            options: { 
              fontFace: "Segoe UI", 
              fontSize: 11,
              color: (item.growth || item.variance || 0) >= 0 ? "00B050" : "C5504B"
            } 
          }
        ])
      ];

      slide.addTable(tableData, {
        x: 0.5, y: 2, w: 9, h: 3,
        colW: [3, 3, 3],
        border: { pt: 1, color: PRIMA_BRANDING.lightGray },
        fill: { color: PRIMA_BRANDING.white }
      });
    }

    // Commentary section
    if (data.commentary) {
      slide.addText("Key Insights", {
        x: 0.5, y: 5.5, w: 9, h: 0.4,
        fontSize: 14,
        color: PRIMA_BRANDING.primaryPurple,
        fontFace: "Segoe UI",
        bold: true
      });

      slide.addText(data.commentary, {
        x: 0.5, y: 5.9, w: 9, h: 1,
        fontSize: 11,
        color: PRIMA_BRANDING.darkText,
        fontFace: "Segoe UI"
      });
    }
  }

  private createVarianceSlide(data: SlideData) {
    const slide = this.pptx.addSlide({ masterName: "PRIMA_MASTER" });

    slide.addText(data.title, {
      x: 0.5, y: 1, w: 9, h: 0.8,
      fontSize: 24,
      color: PRIMA_BRANDING.primaryPurple,
      fontFace: "Segoe UI",
      bold: true
    });

    if (data.data && data.data.length > 0) {
      const tableData = [
        [
          { text: "Department", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } },
          { text: "Actual (€000)", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } },
          { text: "Budget (€000)", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } },
          { text: "Variance (€000)", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } },
          { text: "Variance %", options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white } }
        ],
        ...data.data.map((item: any) => [
          { text: item.department || item.name, options: { fontFace: "Segoe UI", fontSize: 10 } },
          { text: this.formatCurrency(item.actual), options: { fontFace: "Segoe UI", fontSize: 10 } },
          { text: this.formatCurrency(item.budget), options: { fontFace: "Segoe UI", fontSize: 10 } },
          { 
            text: this.formatCurrency(item.variance), 
            options: { 
              fontFace: "Segoe UI", 
              fontSize: 10,
              color: (item.variance || 0) >= 0 ? "00B050" : "C5504B"
            } 
          },
          { 
            text: this.formatPercentage(item.variancePercent), 
            options: { 
              fontFace: "Segoe UI", 
              fontSize: 10,
              color: (item.variancePercent || 0) >= 0 ? "00B050" : "C5504B"
            } 
          }
        ])
      ];

      slide.addTable(tableData, {
        x: 0.5, y: 2, w: 9, h: 3.5,
        colW: [2, 1.75, 1.75, 1.75, 1.75],
        border: { pt: 1, color: PRIMA_BRANDING.lightGray },
        fill: { color: PRIMA_BRANDING.white }
      });
    }

    if (data.commentary) {
      slide.addText(data.commentary, {
        x: 0.5, y: 5.8, w: 9, h: 1,
        fontSize: 11,
        color: PRIMA_BRANDING.darkText,
        fontFace: "Segoe UI"
      });
    }
  }

  private createForecastSlide(data: SlideData) {
    const slide = this.pptx.addSlide({ masterName: "PRIMA_MASTER" });

    slide.addText(data.title, {
      x: 0.5, y: 1, w: 9, h: 0.8,
      fontSize: 24,
      color: PRIMA_BRANDING.primaryPurple,
      fontFace: "Segoe UI",
      bold: true
    });

    // Forecast summary box
    slide.addShape("rect", {
      x: 0.5, y: 2, w: 9, h: 2,
      fill: { color: PRIMA_BRANDING.lightGray },
      line: { width: 2, color: PRIMA_BRANDING.accentTeal },
      rectRadius: 0.2
    });

    if (data.data && data.data.length > 0) {
      const forecastData = data.data[0]; // Assuming first item contains totals
      
      slide.addText("2024 Full Year Forecast", {
        x: 1, y: 2.2, w: 8, h: 0.4,
        fontSize: 16,
        color: PRIMA_BRANDING.primaryPurple,
        fontFace: "Segoe UI",
        bold: true,
        align: "center"
      });

      slide.addText(`Total Revenue: ${this.formatCurrency(forecastData.totalRevenue || 0)}`, {
        x: 1, y: 2.8, w: 4, h: 0.4,
        fontSize: 14,
        color: PRIMA_BRANDING.darkText,
        fontFace: "Segoe UI",
        bold: true
      });

      slide.addText(`Avg Growth: ${this.formatPercentage(forecastData.avgGrowth || 0)}`, {
        x: 5, y: 2.8, w: 4, h: 0.4,
        fontSize: 14,
        color: PRIMA_BRANDING.darkText,
        fontFace: "Segoe UI",
        bold: true
      });
    }

    if (data.commentary) {
      slide.addText("AI Forecast Commentary", {
        x: 0.5, y: 4.5, w: 9, h: 0.4,
        fontSize: 14,
        color: PRIMA_BRANDING.primaryPurple,
        fontFace: "Segoe UI",
        bold: true
      });

      slide.addText(data.commentary, {
        x: 0.5, y: 5, w: 9, h: 1.5,
        fontSize: 11,
        color: PRIMA_BRANDING.darkText,
        fontFace: "Segoe UI"
      });
    }
  }

  private createTableSlide(data: SlideData) {
    const slide = this.pptx.addSlide({ masterName: "PRIMA_MASTER" });

    slide.addText(data.title, {
      x: 0.5, y: 1, w: 9, h: 0.8,
      fontSize: 24,
      color: PRIMA_BRANDING.primaryPurple,
      fontFace: "Segoe UI",
      bold: true
    });

    if (data.data && data.data.length > 0) {
      // Create generic table from data
      const tableData = data.data.map((row: any, index: number) => {
        if (index === 0) {
          // Header row
          return Object.keys(row).map(key => ({
            text: key.charAt(0).toUpperCase() + key.slice(1),
            options: { fontFace: "Segoe UI", fontSize: 12, bold: true, color: PRIMA_BRANDING.white }
          }));
        } else {
          // Data rows
          return Object.values(row).map((value: any) => ({
            text: typeof value === 'number' ? this.formatCurrency(value) : String(value),
            options: { fontFace: "Segoe UI", fontSize: 11 }
          }));
        }
      });

      slide.addTable(tableData, {
        x: 0.5, y: 2, w: 9, h: 4,
        border: { pt: 1, color: PRIMA_BRANDING.lightGray },
        fill: { color: PRIMA_BRANDING.white }
      });
    }
  }

  private createContentSlide(data: SlideData) {
    const slide = this.pptx.addSlide({ masterName: "PRIMA_MASTER" });

    slide.addText(data.title, {
      x: 0.5, y: 1, w: 9, h: 0.8,
      fontSize: 24,
      color: PRIMA_BRANDING.primaryPurple,
      fontFace: "Segoe UI",
      bold: true
    });

    if (data.content) {
      slide.addText(data.content, {
        x: 0.5, y: 2, w: 9, h: 4,
        fontSize: 12,
        color: PRIMA_BRANDING.darkText,
        fontFace: "Segoe UI",
        valign: "top"
      });
    }
  }

  private formatCurrency(value: number): string {
    if (!value) return "€0";
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  private formatPercentage(value: number): string {
    if (!value) return "0.0%";
    return `${(value * 100).toFixed(1)}%`;
  }

  async downloadPPT(filename: string = "Prima_Finance_Report.pptx"): Promise<void> {
    await this.pptx.writeFile({ fileName: filename });
  }
}