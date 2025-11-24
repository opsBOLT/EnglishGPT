import './SnowballSpinner.css';

interface SnowballSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeScaleMap: Record<NonNullable<SnowballSpinnerProps['size']>, number> = {
  sm: 0.3,
  md: 0.6,
  lg: 1,
};

export const SnowballSpinner = ({ size = 'md', label }: SnowballSpinnerProps) => {
  const scale = sizeScaleMap[size] ?? sizeScaleMap.md;

  return (
    <div className="snowball-spinner">
      <div className="pl" style={{ transform: `scale(${scale})` }}>
        <div className="pl__outer-ring"></div>
        <div className="pl__inner-ring"></div>
        <div className="pl__track-cover"></div>
        <div className="pl__ball">
          <div className="pl__ball-texture"></div>
          <div className="pl__ball-outer-shadow"></div>
          <div className="pl__ball-inner-shadow"></div>
          <div className="pl__ball-side-shadows"></div>
        </div>
      </div>
      {label && <p className="pl__label">{label}</p>}
    </div>
  );
};

export default SnowballSpinner;
