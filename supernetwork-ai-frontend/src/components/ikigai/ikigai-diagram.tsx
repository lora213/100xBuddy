'use client';

interface IkigaiDiagramProps {
  passion: string;
  profession: string;
  vocation: string;
  mission: string;
}

export default function IkigaiDiagram({
  passion,
  profession,
  vocation,
  mission
}: IkigaiDiagramProps) {
  // Calculate completion status
  const hasPassion = !!passion.trim();
  const hasProfession = !!profession.trim();
  const hasVocation = !!vocation.trim();
  const hasMission = !!mission.trim();
  
  // Calculate intersection completeness
  const hasDelight = hasPassion && hasProfession;
  const hasComfort = hasProfession && hasVocation; 
  const hasContribution = hasMission && hasVocation;
  const hasFulfillment = hasPassion && hasMission;
  
  // Calculate center (true Ikigai)
  const hasIkigai = hasPassion && hasProfession && hasVocation && hasMission;

  return (
    <div className="relative w-full h-96 flex items-center justify-center">
      {/* Red circle - What you love (Passion) */}
      <div className={`absolute w-60 h-60 rounded-full ${hasPassion ? 'bg-red-200' : 'bg-gray-100'} opacity-70 transform -translate-x-16 -translate-y-16 transition-colors duration-500`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4">
            <span className={`font-medium ${hasPassion ? 'text-red-800' : 'text-gray-400'}`}>
              What you LOVE
            </span>
            {hasPassion && (
              <div className="mt-2 text-xs text-red-600 max-h-16 overflow-hidden">
                {passion.length > 50 ? passion.substring(0, 50) + '...' : passion}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blue circle - What you're good at (Profession) */}
      <div className={`absolute w-60 h-60 rounded-full ${hasProfession ? 'bg-blue-200' : 'bg-gray-100'} opacity-70 transform translate-x-16 -translate-y-16 transition-colors duration-500`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4">
            <span className={`font-medium ${hasProfession ? 'text-blue-800' : 'text-gray-400'}`}>
              What you're GOOD AT
            </span>
            {hasProfession && (
              <div className="mt-2 text-xs text-blue-600 max-h-16 overflow-hidden">
                {profession.length > 50 ? profession.substring(0, 50) + '...' : profession}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Green circle - What you can be paid for (Vocation) */}
      <div className={`absolute w-60 h-60 rounded-full ${hasVocation ? 'bg-green-200' : 'bg-gray-100'} opacity-70 transform translate-x-16 translate-y-16 transition-colors duration-500`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4">
            <span className={`font-medium ${hasVocation ? 'text-green-800' : 'text-gray-400'}`}>
              What you can be PAID FOR
            </span>
            {hasVocation && (
              <div className="mt-2 text-xs text-green-600 max-h-16 overflow-hidden">
                {vocation.length > 50 ? vocation.substring(0, 50) + '...' : vocation}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yellow circle - What the world needs (Mission) */}
      <div className={`absolute w-60 h-60 rounded-full ${hasMission ? 'bg-yellow-200' : 'bg-gray-100'} opacity-70 transform -translate-x-16 translate-y-16 transition-colors duration-500`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4">
            <span className={`font-medium ${hasMission ? 'text-yellow-800' : 'text-gray-400'}`}>
              What the WORLD NEEDS
            </span>
            {hasMission && (
              <div className="mt-2 text-xs text-yellow-600 max-h-16 overflow-hidden">
                {mission.length > 50 ? mission.substring(0, 50) + '...' : mission}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Ikigai */}
      <div className={`absolute w-32 h-32 rounded-full ${hasIkigai ? 'bg-purple-500' : 'bg-gray-200'} flex items-center justify-center transition-all duration-500 z-10`}>
        <span className={`font-bold text-lg ${hasIkigai ? 'text-white' : 'text-gray-400'}`}>
          IKIGAI
        </span>
      </div>

      {/* Intersection labels */}
      <div className={`absolute transform -translate-x-32 ${hasDelight ? 'text-indigo-700' : 'text-gray-400'} text-xs font-medium`}>
        Delight
      </div>
      <div className={`absolute transform translate-x-32 ${hasComfort ? 'text-indigo-700' : 'text-gray-400'} text-xs font-medium`}>
        Comfort
      </div>
      <div className={`absolute transform translate-y-32 ${hasContribution ? 'text-indigo-700' : 'text-gray-400'} text-xs font-medium`}>
        Contribution
      </div>
      <div className={`absolute transform -translate-y-32 ${hasFulfillment ? 'text-indigo-700' : 'text-gray-400'} text-xs font-medium`}>
        Fulfillment
      </div>
    </div>
  );
}
