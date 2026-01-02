import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { gsap } from 'gsap';
import { Transaction } from '@assets/Entities/types';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { TransactionType } from '@/assets/Entities/enum';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(DrawSVGPlugin); // Register the plugin if needed
}

@Component({
  selector: 'app-charts',
  standalone: false,
  templateUrl: './charts.component.html'
})
export class ChartsComponent implements OnInit, AfterViewInit {
  @ViewChild('percentageText') nTxtRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() transactions: Transaction[];
  @Input() chartType: string;
  chartData: any[] = [];

  private ctx!: CanvasRenderingContext2D;
  private centerX: number = 250;
  private centerY: number = 250;
  private radius: number = 150;
  private slices: any[] = [];
  private animationProgress: number = 0;
  private rotationAngle: number = 0;
  private animationId: number = 0;
  private hoveredIndex: number = -1;
  private canvasOffsetX: number = 0;
  private canvasOffsetY: number = 0;

  // Tooltip properties
  tooltipVisible: boolean = false;
  tooltipX: number = 224;
  tooltipY: number = 244;
  tooltipLabel: string = '';
  tooltipValue: number = 0;
  tooltipPercentage: any = null;
  chartView: string;
  value: number = 0;
  color: string = "#fff";

  constructor() { }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.loadChart();
  }

  loadChart(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = 500;
    canvas.height = 500;
    this.ctx = canvas.getContext('2d')!;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.setTransactionDataToChart();
    this.setColorPalette();
    this.calculateSlices();
    this.updateCanvasOffset();
    this.animateEntrance();
    this.startAnimation();
  }

  setTransactionDataToChart(): void {
    const map = new Map();

    if (this.chartType.toLowerCase() === TransactionType.INCOME || this.chartType.toLowerCase() === TransactionType.EXPENSE) {
      this.transactions.forEach(item => {
        if (/[a-zA-Z]/.test(item.category) && item.type === this.chartType.toLowerCase()) {
          if (map.has(item.category)) {
            map.get(item.category).amount += item.amount;
          } else {
            map.set(item.category, { ...item });
          }
        }
      });
    } else if (this.chartType.toLowerCase() === 'summary') {
      this.transactions.forEach(item => {
        if (/[a-zA-Z]/.test(item.category) && (item.type === TransactionType.INCOME || item.type === TransactionType.EXPENSE)) {
          if (map.has(item.type)) {
            map.get(item.type).amount += item.amount;
          } else {
            map.set(item.type, { ...item });
          }
        }
      });
    }

    this.chartData = Array.from(map.values());
    if (this.chartType.toLowerCase() === 'summary') {
      this.chartData.forEach(item => {
        item.category = item.type === TransactionType.INCOME ? 'Income' : 'Expense';
      });
      this.chartData.push({ category: 'Balance', amount: this.chartData.find(i => i.category === 'Income').amount - this.chartData.find(i => i.category === 'Expense').amount });
    }
    const total = this.chartData.reduce((acc, item) => acc + item.amount, 0);
    this.chartData.map(item => {
      item["percentage"] = parseFloat(((item.amount / total) * 100).toFixed(2));
    });
    this.chartData = this.chartData.sort((a, b) => b.percentage - a.percentage);
  }

  setColorPalette(): void {
    // Method 1: Using HSL color generation (best for distinct colors)
    // this.chartData.forEach((item, index) => {
    //   const hue = (index * 360) / this.chartData.length;
    //   item['color'] = `hsl(${hue}, 70%, 60%)`;
    // });

    // Method 2: Predefined color palette
    // const colorPalette = [
    //   '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    //   '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#AAB7B8'
    // ];

    // this.chartData.forEach((item, index) => {
    //   item.color = colorPalette[index % colorPalette.length];
    // });

    // // Method 3: Random vibrant colors
    // this.chartData.forEach((item, index) => {
    //   const r = Math.floor(Math.random() * 156 + 100); // 100-255
    //   const g = Math.floor(Math.random() * 156 + 100);
    //   const b = Math.floor(Math.random() * 156 + 100);
    //   item.color = `rgb(${r}, ${g}, ${b})`;
    // });

    // Method 4: Golden ratio for evenly distributed hues
    const goldenRatio = 0.618033988749895;
    let hue = Math.random(); // Start with random hue

    this.chartData.forEach((item, index) => {
      hue += goldenRatio;
      hue %= 1;
      item.color = `hsl(${hue * 360}, 70%, 60%)`;
    });

    // // Method 5: Material Design inspired colors
    // const materialColors = [
    //   '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB',
    //   '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047',
    //   '#7CB342', '#C0CA33', '#FDD835', '#FFB300', '#FB8C00'
    // ];

    // this.chartData.forEach((item, index) => {
    //   item.color = materialColors[index % materialColors.length];
    // });
  }

  private calculateSlices(): void {
    let currentAngle = -Math.PI / 2; // Start from top

    this.chartData.forEach((data, index) => {
      const angle = (data.percentage / 100) * Math.PI * 2;
      const midAngle = currentAngle + angle / 2;

      this.slices.push({
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        midAngle: midAngle,
        color: data.color,
        value: data.amount,
        label: data.category,
        offsetX: 0,
        offsetY: 0,
        scale: 1
      });

      currentAngle += angle;
    });
  }

  private animateEntrance(): void {
    gsap.to(this, {
      animationProgress: 1,
      duration: 2,
      ease: 'power2.out'
    });
  }

  private startAnimation(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.rotationAngle += 0.003;
      this.draw();
    };
    animate();
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, 500, 500);

    this.slices.forEach((slice, index) => {
      const shadowDepth = 15;
      const adjustedStartAngle = slice.startAngle + this.rotationAngle;
      const adjustedEndAngle = slice.endAngle + this.rotationAngle;
      const animatedEndAngle = adjustedStartAngle + (adjustedEndAngle - adjustedStartAngle) * this.animationProgress;

      this.ctx.save();
      this.ctx.translate(this.centerX + slice.offsetX, this.centerY + slice.offsetY);

      this.ctx.beginPath();
      this.ctx.moveTo(0, shadowDepth);
      this.ctx.arc(0, shadowDepth, this.radius * slice.scale, adjustedStartAngle, animatedEndAngle);
      this.ctx.lineTo(0, shadowDepth);
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fill();

      this.ctx.restore();
    });

    // Draw main slices
    this.slices.forEach((slice, index) => {
      const adjustedStartAngle = slice.startAngle + this.rotationAngle;
      const adjustedEndAngle = slice.endAngle + this.rotationAngle;
      const animatedEndAngle = adjustedStartAngle + (adjustedEndAngle - adjustedStartAngle) * this.animationProgress;

      this.ctx.save();
      this.ctx.translate(this.centerX + slice.offsetX, this.centerY + slice.offsetY);

      // Main slice
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, this.radius * slice.scale, adjustedStartAngle, animatedEndAngle);
      this.ctx.lineTo(0, 0);
      this.ctx.fillStyle = slice.color;
      this.ctx.fill();

      // Highlight effect
      const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * slice.scale);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Border
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Side depth effect
      if (this.animationProgress === 1) {
        const depth = 10;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.radius * slice.scale, adjustedStartAngle, adjustedEndAngle);
        this.ctx.lineTo(0, depth);
        this.ctx.arc(0, depth, this.radius * slice.scale, adjustedEndAngle, adjustedStartAngle, true);
        this.ctx.lineTo(Math.cos(adjustedStartAngle) * this.radius * slice.scale, Math.sin(adjustedStartAngle) * this.radius * slice.scale);
        this.ctx.fillStyle = this.darkenColor(slice.color, 0.3);
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  private darkenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  private updateCanvasOffset(): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.canvasOffsetX = rect.left;
    this.canvasOffsetY = rect.top;
  }

  private getSliceAtPosition(mouseX: number, mouseY: number): number {
    const dx = mouseX - this.centerX;
    const dy = mouseY - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if mouse is within the pie chart radius
    if (distance > this.radius) {
      return -1;
    }

    let angle = Math.atan2(dy, dx) - this.rotationAngle;

    // Normalize angle to [0, 2π]
    while (angle < 0) angle += Math.PI * 2;
    while (angle > Math.PI * 2) angle -= Math.PI * 2;

    // Find which slice the angle falls into
    for (let i = 0; i < this.slices.length; i++) {
      let startAngle = this.slices[i].startAngle + Math.PI / 2;
      let endAngle = this.slices[i].endAngle + Math.PI / 2;

      // Normalize slice angles
      while (startAngle < 0) startAngle += Math.PI * 2;
      while (endAngle < 0) endAngle += Math.PI * 2;

      if (startAngle > endAngle) {
        // Handle wrap-around case
        if (angle >= startAngle || angle <= endAngle) {
          return i;
        }
      } else {
        if (angle >= startAngle && angle <= endAngle) {
          return i;
        }
      }
    }

    return -1;
  }

  onCanvasMouseMove(event: MouseEvent): void {
    this.updateCanvasOffset();

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const scaleX = this.canvasRef.nativeElement.width / rect.width;
    const scaleY = this.canvasRef.nativeElement.height / rect.height;

    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    const sliceIndex = this.getSliceAtPosition(mouseX, mouseY);

    if (sliceIndex !== -1 && sliceIndex !== this.hoveredIndex) {
      // New slice hovered
      if (this.hoveredIndex !== -1) {
        this.resetSlice(this.hoveredIndex);
      }
      this.hoveredIndex = sliceIndex;
      this.animateSlice(sliceIndex);

      // Show tooltip
      this.tooltipVisible = true;
      this.tooltipLabel = this.chartData[sliceIndex].category;
      this.tooltipValue = this.chartData[sliceIndex].amount;
      this.tooltipPercentage = this.chartData[sliceIndex].percentage;
      this.tooltipX = event.clientX - this.canvasOffsetX + 15;
      this.tooltipY = event.clientY - this.canvasOffsetY - 10;
      this.animateCount(this.chartData[sliceIndex].amount);
      this.color = this.chartData[sliceIndex].color;
    } else if (sliceIndex === -1 && this.hoveredIndex !== -1) {
      // Mouse left all slices
      this.resetSlice(this.hoveredIndex);
      this.hoveredIndex = -1;
      this.tooltipVisible = false;
    } else if (sliceIndex !== -1) {
      // Update tooltip position for current slice
      this.tooltipX = event.clientX - this.canvasOffsetX + 15;
      this.tooltipY = event.clientY - this.canvasOffsetY - 10;
    }
  }

  onCanvasMouseLeave(): void {
    if (this.hoveredIndex !== -1) {
      this.resetSlice(this.hoveredIndex);
      this.hoveredIndex = -1;
    }
    this.tooltipVisible = false;
  }

  private animateSlice(index: number): void {
    const slice = this.slices[index];
    const angle = slice.midAngle + this.rotationAngle;
    const offsetDistance = 20;

    gsap.to(slice, {
      offsetX: Math.cos(angle) * offsetDistance,
      offsetY: Math.sin(angle) * offsetDistance,
      scale: 1.1,
      duration: 0.3,
      ease: 'power2.out'
    });
  }

  private resetSlice(index: number): void {
    const slice = this.slices[index];

    gsap.to(slice, {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
  }

  onLegendHover(index: number): void {
    if (this.hoveredIndex !== -1 && this.hoveredIndex !== index) {
      this.resetSlice(this.hoveredIndex);
    }
    this.hoveredIndex = index;
    this.animateSlice(index);

    // Show tooltip near legend
    this.tooltipVisible = true;
    this.tooltipLabel = this.chartData[index].category;
    this.tooltipValue = this.chartData[index].amount;
    this.tooltipPercentage = this.chartData[index].percentage;
    this.animateCount(this.chartData[index].amount);
    this.color = this.chartData[index].color;
  }

  onLegendLeave(index: number): void {
    this.resetSlice(index);
    this.hoveredIndex = -1;
    this.tooltipVisible = false;
  }

  private animateCount(target: number) {
    let start = 0;
    const startTime = performance.now();
    this.value = 0;

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / 800, 1) < 0 ? Math.min((time - startTime) / 800, 1) * -1 : Math.min((time - startTime) / 800, 1);
      this.value = Math.floor(progress * (target - start) + start);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}