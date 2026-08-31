import { useMemo } from 'react'
import { ArrowRight, Crosshair, Path, Pulse } from '@phosphor-icons/react'
import type { HackathonView, ImpactNodeData } from '../app/types'
import { NodeIcon, NodeStateMark, SectionLabel } from './Primitives'

const outcomeLabels = { repaired: 'REPAIRED', verified: 'VERIFIED', skipped: 'SKIPPED' } as const

function ImpactNode({ node }: { node: ImpactNodeData }) {
  return (
    <foreignObject x={node.x} y={node.y} width="148" height="62">
      <div
        className={`impact-node node-${node.state}${node.outcome ? ` outcome-${node.outcome}` : ''}`}
        role="img"
        aria-label={node.outcome ? `${node.label}: ${node.state}, ${outcomeLabels[node.outcome]}` : `${node.label}: ${node.state}`}
        data-node-id={node.id}
        data-node-state={node.state}
        data-node-outcome={node.outcome ?? undefined}
      >
        <NodeIcon kind={node.kind} size={17} />
        <span>{node.label}</span>
        {node.outcome
          ? <em className="node-outcome">{outcomeLabels[node.outcome]}</em>
          : <NodeStateMark state={node.state} />}
      </div>
    </foreignObject>
  )
}

export function ImpactMap({ view }: { view: HackathonView }) {
  const nodesById = useMemo(
    () => new Map(view.graph.nodes.map((node) => [node.id, node])),
    [view.graph.nodes],
  )

  return (
    <section className="impact-panel" aria-labelledby="impact-map-heading">
      <header className="panel-heading impact-heading">
        <div>
          <SectionLabel>Selective revalidation</SectionLabel>
          <h2 id="impact-map-heading">Impact map</h2>
        </div>
        <div className="map-legend" aria-label="Graph state legend">
          <span><i className="legend-dot dot-active" />Affected</span>
          <span><i className="legend-dot dot-review" />Stale</span>
          <span><i className="legend-dot dot-verified" />Verified</span>
          <span><i className="legend-dot dot-repaired" />Repaired</span>
        </div>
      </header>

      {view.triggerCrumb && (
        <div className="trigger-crumb" data-testid="trigger-crumb">
          <Pulse weight="bold" aria-hidden="true" />
          <div>
            <strong>{view.triggerCrumb.label}</strong>
            <span>{view.triggerCrumb.id}{view.triggerCrumb.timestamp ? ` · ${view.triggerCrumb.timestamp}` : ''}</span>
          </div>
          <ArrowRight aria-hidden="true" />
        </div>
      )}

      <div className="graph-stage">
        {!view.graph.metrics && (
          <div className="scope-pending">
            <Crosshair aria-hidden="true" />
            <span>Dependency scope awaiting change signal</span>
          </div>
        )}
        <svg
          className="impact-graph"
          viewBox="0 0 970 414"
          role="img"
          aria-labelledby="graph-title graph-description"
          preserveAspectRatio="xMidYMid meet"
        >
          <title id="graph-title">Returns policy dependency map</title>
          <desc id="graph-description">
            Twelve-node demo graph showing affected, stale, verified, and safely skipped surfaces.
          </desc>
          <defs>
            <marker id="edge-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
          <g className="impact-edges" aria-hidden="true">
            {view.graph.edges.map(([sourceId, targetId]) => {
              const source = nodesById.get(sourceId)!
              const target = nodesById.get(targetId)!
              const active = source.state !== 'unaffected' && target.state !== 'unaffected'
              const stale = target.state === 'stale'
              const verified = target.state === 'verified'
              const sx = source.x + 148
              const sy = source.y + 31
              const tx = target.x
              const ty = target.y + 31
              const bend = Math.max(38, (tx - sx) * 0.46)
              return (
                <path
                  key={`${sourceId}-${targetId}`}
                  className={`impact-edge${active ? ' edge-active' : ''}${stale ? ' edge-stale' : ''}${verified ? ' edge-verified' : ''}`}
                  d={`M ${sx} ${sy} C ${sx + bend} ${sy}, ${tx - bend} ${ty}, ${tx} ${ty}`}
                  markerEnd="url(#edge-arrow)"
                />
              )
            })}
          </g>
          <g className="impact-nodes">
            {view.graph.nodes.map((node) => <ImpactNode key={node.id} node={node} />)}
          </g>
        </svg>
      </div>

      <div className={`graph-metrics${view.graph.metrics ? ' metrics-visible' : ''}`} aria-label="Demo graph metrics">
        <div className="metric-context"><Path aria-hidden="true" /><span>{view.graph.label}</span></div>
        {view.graph.metrics ? (
          <>
            <div><strong>{view.graph.metrics.totalNodes}</strong><span>Total nodes</span></div>
            <div><strong>{view.graph.metrics.affected}</strong><span>Affected</span></div>
            <div><strong>{view.graph.metrics.skipped}</strong><span>Safely skipped</span></div>
            <div><strong>{view.graph.metrics.agentsDispatched}</strong><span>Dispatched</span></div>
          </>
        ) : (
          <div className="metrics-placeholder">Counters appear after impact is scoped</div>
        )}
      </div>
    </section>
  )
}
