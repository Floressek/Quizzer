import React, { useEffect, useRef, useState } from "react";
import cloud from "d3-cloud";
import * as d3 from "d3";

type Word = {
    text: string;
    value: number;
};

type Props = {
    data: Word[];
    height: number;
    font?: string;
    fontSize: (word: Word) => number;
    rotate?: number | ((word: Word) => number);
    padding?: number;
    fill?: string | ((word: Word) => string);
    onWordClick?: (event: cloud.Word, word: Word) => void;
};

const WordCloud: React.FC<Props> = ({
                                        data,
                                        height,
                                        font = "sans-serif",
                                        fontSize,
                                        rotate = 0,
                                        padding = 5,
                                        fill = "#000",
                                        onWordClick,
                                    }) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
        width: 600,
        height: height,
    });

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width } = entry.contentRect;
                setDimensions({ width, height });
            }
        });

        if (wrapperRef.current) observer.observe(wrapperRef.current);
        return () => observer.disconnect();
    }, [height]);

    useEffect(() => {
        if (!data || data.length === 0) return;

        const layout = cloud<Word>()
            .size([dimensions.width, dimensions.height])
            .words(data)
            .padding(padding)
            .rotate(typeof rotate === "function" ? rotate : () => rotate)
            .font(font)
            .fontSize((d) => fontSize(d))
            .on("end", draw);

        layout.start();

        function draw(words: cloud.Word[]) {
            const svg = d3
                .select(svgRef.current!)
                .attr("width", dimensions.width)
                .attr("height", dimensions.height);

            svg.selectAll("*").remove();

            svg
                .append("g")
                .attr("transform", `translate(${dimensions.width / 2}, ${dimensions.height / 2})`)
                .selectAll("text")
                .data(words)
                .enter()
                .append("text")
                .style("font-size", (d) => `${d.size}px`)
                .style("font-family", font)
                .style("fill", (d) => (typeof fill === "function" ? fill(d as Word) : fill))
                .attr("text-anchor", "middle")
                .attr("cursor", onWordClick ? "pointer" : "default")
                .attr("transform", (d) => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
                .text((d) => d.text || "")
                .on("click", function (event, d) {
                    if (onWordClick) onWordClick(event, d as unknown as Word);
                });
        }
    }, [data, dimensions, font, fontSize, rotate, padding, fill, onWordClick]);

    return (
        <div ref={wrapperRef} style={{ width: "100%", height: `${height}px` }}>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default WordCloud;
