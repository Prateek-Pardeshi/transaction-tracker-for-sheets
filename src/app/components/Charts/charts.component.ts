import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { gsap } from 'gsap';
import { Transaction } from '@assets/Entities/types';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(DrawSVGPlugin); // Register the plugin if needed
}

@Component({
  selector: 'app-charts',
  standalone: false,
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css'
})
export class ChartsComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChartSvg') pieChartRef!: ElementRef<SVGElement>;
  @ViewChild('centerCircle') centerCircleRef!: ElementRef<SVGCircleElement>;
  @ViewChild('percentageText') nTxtRef!: ElementRef<SVGTextElement>;

  // Example data array
  chartData = [{category: "Food", amount: 523}, {category: "Personal", amount: 200}, {category: "Travel", amount: 2000}]; // Example data
  transactions: Transaction[] = [];

  constructor() { }

  ngOnInit(): void {
    const storedTransactions = localStorage.getItem('transactions');
    this.transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
  }

  // ngAfterViewInit is the correct place to run DOM manipulation/animations
  ngAfterViewInit(): void {
    // Check if the element references are available
    if (this.pieChartRef || this.centerCircleRef || this.nTxtRef) {
      const map = new Map();

      this.transactions.forEach(item => {
        if (/[a-zA-Z]/.test(item.category)) {
          if (map.has(item.category)) {
            map.get(item.category).amount += item.amount;
          } else {
            map.set(item.category, { ...item });
          }
        }
      });

      const result = Array.from(map.values())
      this.makeChart(this.chartData);
      //this.prepareChart(this.chartData);
    } else {
      console.error('One or more required SVG elements were not found.');
    }
  }

  prepareChart(arr: any[]): void {
    const pieChart = this.pieChartRef.nativeElement;
    const centerCircle = this.centerCircleRef.nativeElement;
    const nTxt = this.nTxtRef.nativeElement;

    arr = arr.sort((a, b) => b.amount - a.amount);
    if (!pieChart || !centerCircle) return;
    // arr = [{category: "Food", amount: 523}]
    const sum = arr.reduce((a, { amount }) => a + amount, 0);
    const centerRadius = Number(gsap.getProperty(centerCircle, 'r'));

    let startAngle = 0;
    for (let i = 0; i < arr.length; i++) {

      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pieChart.appendChild(c);
      const segmentPercent = arr[i].amount / sum * 100;
      const strokeWidth = 10 * arr.length - 10 * i;
      const dataSw = strokeWidth;

      const circumference = 2 * Math.PI * centerRadius;
      const segmentLength = (segmentPercent / 100) * circumference
      const dashArray = `${segmentLength}px ${circumference - segmentLength}px`;
      const dashOffset = circumference - circumference * (startAngle / 360);
      startAngle += (segmentLength / 100) * 360;

      c.addEventListener('pointerenter', (e) => {
        const t = e.currentTarget as SVGElement;
        const strokeWidth = gsap.getProperty(t, 'data-sw') as number;

        gsap.to(t, { ease: 'expo', attr: { 'stroke-width': strokeWidth + 8 } });
        gsap.to(nTxt, {
          ease: 'power2.inOut',
          opacity: 1,
          attr: { fill: gsap.getProperty(t, 'stroke') as string },
          innerHTML: gsap.getProperty(t, 'data-val') + '%',
          snap: 'innerHTML'
        });
      });

      c.addEventListener('pointerleave', (e) => {
        const t = e.currentTarget as SVGElement;
        const strokeWidth = gsap.getProperty(t, 'data-sw') as number;

        gsap.to(t, { ease: 'expo', attr: { 'stroke-width': strokeWidth } });
        gsap.to(nTxt, { opacity: 0, ease: 'power2.inOut' });
      });

      gsap.set(c, {
        attr: {
          'data-val': Math.round(segmentPercent),
          'data-sw': dataSw,
          'fill': 'transparent',
          cx: 50,
          cy: 50,
          r: centerRadius, // Use the retrieved radius
          stroke: 'hsl(' + (306 + 66 * i) + ',' + (100 - i / arr.length * 70) + '%,' + (65 - i / arr.length * 50) + '%)',
          'stroke-width': dataSw,
          'style': `stroke-dashoffset: ${dashOffset}; stroke-dasharray: ${dashArray};`
        }
      });
    }
    gsap.set(pieChart, { rotate: -90, svgOrigin: '10 10', transformOrigin: "center center" });
    // gsap.set(nTxt, { rotate: 90 });
  }

  makeChart(arr: any[]): void {
    // Get the native SVG elements
    const pieChart = this.pieChartRef.nativeElement;
    const centerCircle = this.centerCircleRef.nativeElement;
    const nTxt = this.nTxtRef.nativeElement;

    const sum = arr.reduce((a, {amount}) => a + amount, 0);
    let currentPercent = 0;

    // Get the radius of the center circle
    const centerRadius = gsap.getProperty(centerCircle, 'r');
    
    // Set initial GSAP properties for the text element
    gsap.set(nTxt, { opacity: 0, innerHTML: '' });

    for (let i = 0; i < arr.length; i++) {
      // Calculate current cumulative percentage
      const segmentPercent = arr[i].amount / sum * 100;
      currentPercent += segmentPercent;

      const dur = 3 - 1.5 * i / arr.length;
      const ez = 'power3';
      
      // Create SVG circle element
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      
      // Note: The original code used prepend, which might cause layering issues.
      // Append is generally safer for SVG circles unless a specific visual order is needed.
      pieChart.appendChild(c);
      
      // Calculate stroke width based on segment index
      const strokeWidth = 10 * arr.length - 10 * i;
      const dataSw = strokeWidth;
      
      gsap.set(c, {
        attr: {
          'data-val': Math.round(segmentPercent),
          'data-sw': dataSw,
          cx: 50,
          cy: 50,
          r: centerRadius, // Use the retrieved radius
          stroke: 'hsl(' + (306 + 66 * i) + ',' + (100 - i / arr.length * 70) + '%,' + (65 - i / arr.length * 50) + '%)',
          'stroke-width': dataSw 
        }
      });
      
      // Animate the circle using drawSVG (requires DrawSVGPlugin)
      // Note: The original code starts from 0% and animates to the *end* of the segment.
      // For a proper pie chart stroke effect, you typically animate from the *start* of the segment
      // to the *end* of the segment. The original logic here is creating overlapping strokes.
      // For the original effect:
      gsap.fromTo(c, { drawSVG: 0 }, { drawSVG: '0% ' + (currentPercent) + '%', duration: dur, ease: ez });
      
      //--- Event Listeners ---
      c.addEventListener('pointerenter', (e) => {
        const t = e.currentTarget as SVGElement;
        const strokeWidth = gsap.getProperty(t, 'data-sw') as number;
        
        gsap.to(t, { ease: 'expo', attr: { 'stroke-width': strokeWidth + 8 } });
        gsap.to(nTxt, {
          ease: 'power2.inOut',
          opacity: 1,
          attr: { fill: gsap.getProperty(t, 'stroke') as string },
          innerHTML: gsap.getProperty(t, 'data-val') + '%',
          snap: 'innerHTML'
        });
      });
      
      c.addEventListener('pointerleave', (e) => {
        const t = e.currentTarget as SVGElement;
        const strokeWidth = gsap.getProperty(t, 'data-sw') as number;

        gsap.to(t, { ease: 'expo', attr: { 'stroke-width': strokeWidth } });
        gsap.to(nTxt, { opacity: 0, ease: 'power2.inOut' });
      });
      //--- End Event Listeners ---

      // --- Shade/Shadow Animation ---
      if (i <= arr.length - 2) {
        const shade = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        pieChart.appendChild(shade); // Use appendChild for clarity
        
        // Note: The 'points' attribute is hardcoded and seems specific to a 3D effect.
        // It's kept for functional parity with the original code.
        gsap.fromTo(shade, {
          attr: { points: '243,200 350,200 350,210' },
          opacity: 0.4 - i / arr.length * 0.35,
          pointerEvents: 'none',
          transformOrigin: '50 50'
        }, {
          rotate: currentPercent / 100 * 360,
          duration: dur,
          ease: ez
        });
      }
      // --- End Shade/Shadow Animation ---
    }

    gsap.set(pieChart, { rotate: -90, svgOrigin: '10 10', transformOrigin: "center center" });
  }
}