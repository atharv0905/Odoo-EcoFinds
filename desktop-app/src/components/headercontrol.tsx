
// import { Minimize2, Square, X, CopyMinus } from 'lucide-react';
// import { useEffect, useState } from 'react';


const Header = () => {
  // const [appTitle, setAppTitle] = useState('');
  // const [isMaximized, setIsMaximized] = useState(false);

  // useEffect(() => {
  //   const fetchWindowState = async () => {
  //     const title = await window.electronAPI.getTitle();
  //     const maximized = await window.electronAPI.isMaximized();
  //     setAppTitle(title);
  //     setIsMaximized(maximized);
  //   };

  //   fetchWindowState();

  //   // Optional: You can set up a polling or event-based system to sync changes
  // }, []);

  // const handleMinimize = () => window.electronAPI.minimize();

  // const handleMaximize = async () => {
  //   await window.electronAPI.maximize();
  //   const maximized = await window.electronAPI.isMaximized();
  //   setIsMaximized(maximized);
  // };

  // const handleClose = () => window.electronAPI.close();

  return (
    <header
      className="sticky top-0 left-0  right-0 flex justify-between items-center bg-card  h-10 text-foreground z-50 drag p-2 border-b border-border"
    >
      {/* Left side: Title */}
      <div className="text-sm font-semibold select-none">AppName</div>

      {/* Right side: Buttons */}
      <div className="flex control-buttons no-drag">
        {/* <button
          onClick={handleMinimize}
          className="p-1 m-1 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors rounded-full"
          aria-label="Minimize"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1 m-1 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors rounded-full"
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <CopyMinus className="w-3 h-3" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>
        <button
          onClick={handleClose}
          className="p-1 m-1 hover:bg-destructive hover:text-white text-muted-foreground transition-colors rounded-full"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button> */}
      </div>
    </header>
  );
};

export default Header;
